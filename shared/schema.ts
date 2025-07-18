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
  texturePhotoUrl: text("texture_photo_url"),
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
  displayTitle: text("display_title"),
  marketingTitle: text("marketing_title"),
  seoKeywords: text("seo_keywords"),
  marketingNote: text("marketing_note"),
  productVideoUrl: text("product_video_url"),
  productVideoTitle: text("product_video_title"),
  isWholesaleOnly: boolean("is_wholesale_only").default(false).notNull(),
  additionalImages: text("additional_images").array(),
  allowBulkPickup: boolean("allow_bulk_pickup").default(false),
  availableSizeOptions: text("available_size_options").array(),
  minOrderQuantity: integer("min_order_quantity").notNull().default(1),
  maxOrderQuantity: integer("max_order_quantity"),
  isPriceNegotiable: boolean("is_price_negotiable").default(false).notNull(),
  requiresQuote: boolean("requires_quote").default(false).notNull(),
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

export const pricingTiers = pgTable("pricing_tiers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  minQuantity: integer("min_quantity").notNull(),
  maxQuantity: integer("max_quantity"),
  discountPercentage: integer("discount_percentage").default(0),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const sizeCategories = pgTable("size_categories", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  name: text("name").notNull(),
  description: text("description"),
  unit: text("unit").notNull(), // e.g., "ton", "cubic yard", "bag"
  basePrice: integer("base_price").notNull(),
  minOrderQuantity: integer("min_order_quantity").notNull(),
  maxOrderQuantity: integer("max_order_quantity"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const deliveryZones = pgTable("delivery_zones", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  minDistance: integer("min_distance").notNull(), // in miles
  maxDistance: integer("max_distance").notNull(), // in miles
  baseRate: integer("base_rate").notNull(), // base delivery cost
  perMileRate: integer("per_mile_rate").notNull(), // cost per mile
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const priceHistory = pgTable("price_history", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .references(() => products.id)
    .notNull(),
  sizeCategoryId: integer("size_category_id")
    .references(() => sizeCategories.id)
    .notNull(),
  price: integer("price").notNull(),
  effectiveDate: timestamp("effective_date").notNull(),
  endDate: timestamp("end_date"),
  reason: text("reason"),
  createdBy: text("created_by").notNull(),
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
