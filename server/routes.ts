import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactMessageSchema, insertOnboardingRequestSchema, insertProductSchema } from "@shared/schema";
import { productsData } from "../client/src/data/productData";
import inventoryRoutes from "./routes/inventory";
import checkoutRoutes from "./routes/checkout";
import authRoutes from "./routes/auth";
import pricingRoutes from "./routes/pricing";
import triviaLeadsRoutes from "./routes/triviaLeads";
import publicProductsRoutes from "./routes/publicProducts";
import simpleProductsRoutes from "./routes/simpleProducts";
import productSyncRoutes from "./routes/productSync";
import orderManagementRoutes from "./routes/orderManagement";
import payAndPickupRoutes from "./routes/payAndPickup";

export async function registerRoutes(app: Express): Promise<Server> {
  // API Routes

  // Inventory routes
  app.use("/api/inventory", inventoryRoutes);

  // Checkout routes
  app.use("/api/checkout", checkoutRoutes);

  // Pricing routes
  app.use("/api/pricing", pricingRoutes);

  // Customer authentication routes
  app.use("/api/auth", authRoutes);

  // Trivia leads routes
  app.use("/api", triviaLeadsRoutes);

  // Public Products routes (with slug support)
  app.use("/api/public/products", publicProductsRoutes);

  // Simple Products routes (working with current data)
  app.use("/api/simple/products", simpleProductsRoutes);

  // Product sync routes
  app.use("/api/product-sync", productSyncRoutes);

  // Order management routes
  app.use("/api/orders", orderManagementRoutes);

  // Pay & Pickup routes
  app.use("/api/pay-and-pickup", payAndPickupRoutes);

  // Legacy Products routes for backward compatibility
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getAllProducts();
      res.json(products);
    } catch (error) {
      console.error("Error getting products:", error);
      res.status(500).json({ message: "Error fetching products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const product = await storage.getProductById(productId);

      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(product);
    } catch (error) {
      console.error("Error getting product by ID:", error);
      res.status(500).json({ message: "Error fetching product" });
    }
  });

  // Seeder route - to be used only in development
  if (process.env.NODE_ENV === "development") {
    app.post("/api/seed/products", async (req, res) => {
      try {
        // Clear existing products
        await storage.clearProducts();

        // Seed products
        const products = [];
        for (const product of productsData) {
          const parsedProduct = insertProductSchema.parse(product);
          const newProduct = await storage.createProduct(parsedProduct);
          products.push(newProduct);
        }

        res.json({ message: "Products seeded successfully", count: products.length });
      } catch (error) {
        console.error("Error seeding products:", error);
        res.status(500).json({ message: "Error seeding products", error });
      }
    });
  }

  // Onboarding requests
  app.post("/api/onboarding", async (req, res) => {
    try {
      const onboardingData = insertOnboardingRequestSchema.parse(req.body);
      const onboardingRequest = await storage.createOnboardingRequest(onboardingData);

      res.status(201).json({ message: "Onboarding request submitted successfully", id: onboardingRequest.id });
    } catch (error) {
      console.error("Error creating onboarding request:", error);
      res.status(400).json({ message: "Invalid onboarding request data" });
    }
  });

  // Contact messages
  app.post("/api/contact", async (req, res) => {
    try {
      const contactData = insertContactMessageSchema.parse(req.body);
      const contactMessage = await storage.createContactMessage(contactData);

      res.status(201).json({ message: "Contact message sent successfully", id: contactMessage.id });
    } catch (error) {
      console.error("Error creating contact message:", error);
      res.status(400).json({ message: "Invalid contact message data" });
    }
  });

  // User profile - this would typically check auth
  app.get("/api/users/profile", (req, res) => {
    // Mock response for demo purposes
    // In a real app, you would get the user ID from the session
    // and fetch the real user data from the database
    res.json({
      id: 1,
      username: "demo_user",
      email: "demo@example.com",
      fullName: "Demo User",
      companyName: "Demo Company",
      phoneNumber: "(555) 123-4567",
      address: "123 Main St",
      city: "Anytown",
      state: "CA",
      zipCode: "12345",
      businessType: "Landscaping Company",
      approved: true,
      createdAt: new Date(),
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
