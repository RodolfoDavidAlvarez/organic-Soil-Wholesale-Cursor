import { pgTable, text, serial, integer, boolean, jsonb, timestamp, uuid, inet } from "drizzle-orm/pg-core";
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
  productStatus: text("product_status").default("active"),
  payAndPickupDisplayOrder: integer("pay_and_pickup_display_order").default(0),
  allowBulkPickup: boolean("allow_bulk_pickup").default(false),
  availableSizeOptions: text("available_size_options").array(),
  sizePriceOptions: jsonb("size_price_options").$type<
    {
      key: string;
      label: string;
      priceCents: number;
      price: number;
      image?: string;
      description?: string;
      isActive?: boolean;
      displayOrder?: number;
    }[]
  >(),
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

// Admin tables
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").default("admin").notNull(),
  fullName: text("full_name"),
  phone: text("phone"),
  companyName: text("company_name"),
  title: text("title"),
  slug: text("slug").unique(),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  bannerImageUrl: text("banner_image_url"),
  galleryImages: text("gallery_images").array(),
  videoUrls: text("video_urls").array(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  website: text("website"),
  socialLinks: jsonb("social_links").$type<{
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    [key: string]: string | undefined;
  }>(),
  contactButtonText: text("contact_button_text").default("Enter Your Contact Details"),
  contactCardButtonText: text("contact_card_button_text").default("Download Contact Card"),
  contactFormTitle: text("contact_form_title").default("Get In Touch"),
  contactFormDescription: text("contact_form_description"),
  hasLandingPage: boolean("has_landing_page").default(false),
  permissions: jsonb("permissions").default({}).$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  isActive: boolean("is_active").default(true).notNull(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  adminId: integer("admin_id").references(() => adminUsers.id, { onDelete: "cascade" }).notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  adminId: integer("admin_id").references(() => adminUsers.id),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: integer("entity_id"),
  oldValues: jsonb("old_values").$type<Record<string, any>>(),
  newValues: jsonb("new_values").$type<Record<string, any>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
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

// CRM Tables
export const representatives = pgTable("representatives", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  website: text("website"),
  bio: text("bio"),
  photoUrl: text("photo_url"),
  bannerImageUrl: text("banner_image_url"),
  galleryImages: text("gallery_images").array(),
  videoUrls: text("video_urls").array(),
  companyName: text("company_name"),
  title: text("title"),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  socialLinks: jsonb("social_links").$type<{
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    instagram?: string;
    [key: string]: string | undefined;
  }>(),
  customFields: jsonb("custom_fields").$type<Record<string, any>>(),
  contactButtonText: text("contact_button_text").default("Enter Your Contact Details").notNull(),
  contactCardButtonText: text("contact_card_button_text").default("Download Contact Card").notNull(),
  contactFormTitle: text("contact_form_title").default("Get In Touch").notNull(),
  contactFormDescription: text("contact_form_description"),
  isActive: boolean("is_active").default(true).notNull(),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const representativeContacts = pgTable("representative_contacts", {
  id: serial("id").primaryKey(),
  representativeId: integer("representative_id")
    .references(() => representatives.id, { onDelete: "cascade" })
    .notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  companyName: text("company_name"),
  message: text("message"),
  source: text("source").default("landing_page"),
  status: text("status").default("new").notNull(),
  notes: text("notes"),
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schemas for inserting data
export const insertRepresentativeSchema = createInsertSchema(representatives).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRepresentativeContactSchema = createInsertSchema(representativeContacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type definitions
export type InsertRepresentative = z.infer<typeof insertRepresentativeSchema>;
export type Representative = typeof representatives.$inferSelect;

export type InsertRepresentativeContact = z.infer<typeof insertRepresentativeContactSchema>;
export type RepresentativeContact = typeof representativeContacts.$inferSelect;

// Operations System - BOL Management
export const opsBols = pgTable("ops_bols", {
  id: serial("id").primaryKey(),
  bolNumber: text("bol_number").notNull().unique(), // BOL-20260121-001
  ticketNumber: text("ticket_number"), // Optional manual ticket reference
  date: timestamp("date").notNull(),

  // Origin Information
  originLocation: text("origin_location").notNull().default("Phoenix, AZ Facility"),
  originAddress: text("origin_address").notNull().default("1634 North 19th Avenue"),
  originCity: text("origin_city").notNull().default("Phoenix"),
  originState: text("origin_state").notNull().default("AZ"),
  originZip: text("origin_zip").notNull().default("85007"),

  // Destination Information
  customerName: text("customer_name").notNull(),
  destinationAddress: text("destination_address").notNull(),
  destinationCity: text("destination_city"),
  destinationState: text("destination_state"),
  destinationZip: text("destination_zip"),
  onsiteContactName: text("onsite_contact_name"),
  onsiteContactPhone: text("onsite_contact_phone"),

  // Material Information
  materialType: text("material_type").notNull(), // e.g., "Orchard Compost (Pistachio Blend)"
  materialDescription: text("material_description"),
  loadType: text("load_type").notNull().default("Bulk Material (Walking Floor)"),

  // Weight Information
  grossWeight: integer("gross_weight").notNull(), // in pounds
  tareWeight: integer("tare_weight").notNull(), // in pounds
  netWeight: integer("net_weight").notNull(), // in pounds (auto-calculated)
  netWeightTons: text("net_weight_tons"), // calculated display value

  // Carrier/Transport Information
  carrierName: text("carrier_name").default("James Bond Trucking"),
  driverName: text("driver_name"),
  truckNumber: text("truck_number"),
  licensePlate: text("license_plate"),
  trailerNumber: text("trailer_number"),

  // Timing
  timeIn: text("time_in"),
  timeOut: text("time_out"),

  // Signatures (Base64 encoded images or text)
  driverSignature: text("driver_signature"),
  sswRepSignature: text("ssw_rep_signature"),
  receiverSignature: text("receiver_signature"),
  scaleOperatorInitials: text("scale_operator_initials"),

  // Additional Information
  notes: text("notes"),
  referenceNumber: text("reference_number"), // Project name or PO number

  // Status & Tracking
  status: text("status").default("draft").notNull(), // draft, sent, delivered, signed
  createdBy: text("created_by").notNull(), // email of admin who created it
  sentToEmail: text("sent_to_email"),
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),

  // Metadata
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schema for inserting BOL data
export const insertOpsBolSchema = createInsertSchema(opsBols).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type definitions
export type InsertOpsBol = z.infer<typeof insertOpsBolSchema>;
export type OpsBol = typeof opsBols.$inferSelect;

// Operations System - Scheduled Loads (Logistics Calendar)
export const scheduledLoads = pgTable("scheduled_loads", {
  id: serial("id").primaryKey(),

  // Scheduling Information
  date: timestamp("date").notNull(),
  timeSlot: text("time_slot"), // e.g., "6:00 AM", "Morning", etc.

  // Route/Load Type
  routeType: text("route_type").notNull(), // 'outbound' or 'inbound'

  // Load Details
  customer: text("customer").notNull(), // Customer or supplier name
  destination: text("destination").notNull(), // Address or location description
  material: text("material").notNull(), // What's being transported
  quantity: text("quantity"), // e.g., "~25 tons", "Full load"

  // Driver/Carrier
  driver: text("driver"),
  carrierName: text("carrier_name"),
  truckNumber: text("truck_number"),

  // Status Tracking
  status: text("status").default("scheduled").notNull(), // scheduled, in_progress, completed, cancelled

  // Deal/Project Reference
  deal: text("deal"), // Reference to deal/project (e.g., "Willcox Pistachio", "Tyson/Vanguard")

  // Contact Information
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),

  // Notes
  notes: text("notes"),

  // Metadata
  createdBy: text("created_by"), // email of admin who created it
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schema for inserting scheduled load data
export const insertScheduledLoadSchema = createInsertSchema(scheduledLoads).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type definitions
export type InsertScheduledLoad = z.infer<typeof insertScheduledLoadSchema>;
export type ScheduledLoad = typeof scheduledLoads.$inferSelect;
