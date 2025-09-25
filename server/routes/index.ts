import { type Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import actual route modules
import adminAuthRoutes from "./admin/supabaseAuth.js";
import adminProductRoutes from "./admin/productsSimple.js";
import adminOrderRoutes from "./admin/orders.js";
import adminImportExportRoutes from "./admin/productImportExport.js";
import publicProductRoutes from "./publicProducts.js";
import qrCheckoutRoutes from "./qrCheckout.js";
import triviaLeadsRoutes from "./triviaLeads.js";
// import authRoutes from "./auth.js";
// import checkoutRoutes from "./checkout.js";
// import inventoryRoutes from "./inventory.js";
// import pricingRoutes from "./pricing.js";

export function registerRoutes(app: Express): Promise<Server> {
  // Serve static files from client/public in development
  if (process.env.NODE_ENV !== 'production') {
    app.use(express.static(path.join(__dirname, '../../client/public')));
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Register route modules
  app.use("/api/admin/auth", adminAuthRoutes);
  app.use("/api/admin/products", adminProductRoutes);
  app.use("/api/admin/orders", adminOrderRoutes);
  app.use("/api/admin/products", adminImportExportRoutes);
  app.use("/api/products", publicProductRoutes);
  app.use("/api/qr", qrCheckoutRoutes);
  app.use("/api", triviaLeadsRoutes);
  // app.use("/api/auth", authRoutes);
  // app.use("/api/checkout", checkoutRoutes);
  // app.use("/api/inventory", inventoryRoutes);
  // app.use("/api/pricing", pricingRoutes);

  // Catch-all for API routes that don't exist
  app.use("/api/*", (req, res) => {
    res.status(404).json({ 
      error: "API endpoint not found",
      path: req.originalUrl
    });
  });

  const server = createServer(app);
  return Promise.resolve(server);
}