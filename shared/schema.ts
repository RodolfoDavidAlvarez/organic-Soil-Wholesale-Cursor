import { pgTable, text, serial, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  companyName: text("company_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  businessType: text("business_type").notNull(),
  approved: boolean("approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  price: integer("price").notNull(),
  stockQuantity: integer("stock_quantity").notNull(),
  imageUrl: text("image_url"),
  ingredients: text("ingredients"),
  targetAudience: text("target_audience"),
  recommendedUses: text("recommended_uses"),
  story: text("story"),
  usage: text("usage"),
  certifications: text("certifications"),
  features: text("features"),
  sizeOptions: text("size_options"),
  productType: text("product_type"),
  safetyPrecautions: text("safety_precautions"),
  warranty: text("warranty"),
  isWholesaleOnly: boolean("is_wholesale_only").default(false).notNull(),
  additionalImages: text("additional_images").array(),
  allowBulkPickup: boolean("allow_bulk_pickup").default(false),
  availableSizeOptions: text("available_size_options").array(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  businessName: text("business_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  deliveryType: text("delivery_type").notNull(),
  address: text("address"),
  pickupLocation: text("pickup_location"),
  orderItems: jsonb("order_items").notNull(),
  palletGroups: jsonb("pallet_groups"),
  subtotal: integer("subtotal").notNull(),
  discount: integer("discount"),
  total: integer("total").notNull(),
  status: text("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  notes: text("notes"),
});

export const onboardingRequests = pgTable("onboarding_requests", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  companyName: text("company_name").notNull(),
  email: text("email").notNull(),
  phoneNumber: text("phone_number").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  businessType: text("business_type").notNull(),
  productsOfInterest: text("products_of_interest").array(),
  additionalInfo: text("additional_info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  status: text("status").default("pending").notNull(),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schemas for inserting data
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  approved: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertOnboardingRequestSchema = createInsertSchema(onboardingRequests).omit({
  id: true,
  createdAt: true,
  status: true,
});

export const insertContactMessageSchema = createInsertSchema(contactMessages).omit({
  id: true,
  createdAt: true,
});

// Type definitions for use throughout the application
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOnboardingRequest = z.infer<typeof insertOnboardingRequestSchema>;
export type OnboardingRequest = typeof onboardingRequests.$inferSelect;

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;

// Additional type definitions for the order flow
export interface SizeCategory {
  id: string;
  name: string;
  units: number;
  price: number;
  discountEligible: boolean;
}

export interface PalletGroup {
  id: string;
  category: string;
  products: string[]; // IDs of products in this group
  totalUnits: number;
  isComplete: boolean;
  hasDiscount: boolean;
}

export interface ProductSelection {
  id: string;
  productId: number;
  productName: string;
  sizeOption: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  palletGroupId?: string;
  hasDiscount: boolean;
}

export interface BusinessInfo {
  name: string;
  email: string;
  phone: string;
  deliveryType: "delivery" | "pickup";
  address?: string;
  pickupLocation?: string;
}
