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

export interface SizeCategory {
  name: string;
  image: string;
}

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
  sizeCategories: jsonb("size_categories").array().$type<SizeCategory[]>().optional(),
  productType: text("product_type"),
  safetyPrecautions: text("safety_precautions"),
  warranty: text("warranty"),
  isWholesaleOnly: boolean("is_wholesale_only").default(false).notNull(),
  additionalImages: text("additional_images").array(),
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

// NOTE: .omit() is not used due to a bug in drizzle-zod with TypeScript 5.x. Extra fields like id, createdAt, etc. must be omitted manually in your code when inserting.
export const insertUserSchema = createInsertSchema(users);
export const insertProductSchema = createInsertSchema(products);
export const insertOnboardingRequestSchema = createInsertSchema(onboardingRequests);
export const insertContactMessageSchema = createInsertSchema(contactMessages);

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

export type InsertOnboardingRequest = z.infer<typeof insertOnboardingRequestSchema>;
export type OnboardingRequest = typeof onboardingRequests.$inferSelect;

export type InsertContactMessage = z.infer<typeof insertContactMessageSchema>;
export type ContactMessage = typeof contactMessages.$inferSelect;
