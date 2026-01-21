import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes/index.js";
import { setupVite, serveStatic, log } from "./vite.js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

// Load environment variables from server/.env
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), ".env") });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Apply JSON middleware to all routes except uploads
// Increase limit to 50MB to handle base64 encoded images and audio
app.use((req, res, next) => {
  if (req.path.startsWith("/api/admin/uploads")) {
    // Skip JSON parsing for upload routes
    next();
  } else {
    express.json({ limit: '50mb' })(req, res, next);
  }
});

app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Trust proxy for Vercel deployment
app.set("trust proxy", 1);

// Simple admin login endpoint - TEMPORARY
app.post("/api/admin-login-temp", (req, res) => {
  const { email, password } = req.body;

  // Super Admin
  if (email === "ralvarez@soilseedandwater.com" && password === "admin123") {
    const token = jwt.sign({ id: "1", email: email, role: "super_admin" }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "8h" });

    res.json({
      token,
      admin: {
        id: "1",
        email: email,
        full_name: "Rodolfo Alvarez",
        role: "super_admin",
      },
    });
  }
  // General Operations Login
  else if (email === "operations@soilseedandwater.com" && password === "ops2026") {
    const token = jwt.sign({ id: "2", email: email, role: "operations" }, process.env.JWT_SECRET || "your-secret-key", { expiresIn: "8h" });

    res.json({
      token,
      admin: {
        id: "2",
        email: email,
        full_name: "Operations Team",
        role: "operations",
      },
    });
  }
  else {
    res.status(401).json({ error: "Invalid credentials" });
  }
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

async function startServer() {
  // Register routes and get the HTTP server
  const server = await registerRoutes(app);

  // Setup Vite in development mode
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  }

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    const publicPath = process.env.VERCEL ? path.join(__dirname, "../../dist/public") : path.join(__dirname, "../dist/public");

    // Serve static files from the public directory
    app.use(express.static(publicPath));

    // Serve assets with proper caching headers
    app.use(
      "/assets",
      express.static(path.join(publicPath, "assets"), {
        maxAge: "1y",
        immutable: true,
      })
    );

    // Handle all other routes by serving index.html
    app.get("*", (req, res, next) => {
      if (!req.path.startsWith("/api")) {
        res.sendFile(path.join(publicPath, "index.html"));
      } else {
        next();
      }
    });
  }

  // Start the server
  const PORT = process.env.PORT || 3000;
  server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);

export default app;
