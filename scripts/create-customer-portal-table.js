#!/usr/bin/env node

/**
 * Script to create customer_portal_products table
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createCustomerPortalTable() {
  console.log("🏗️  Creating customer_portal_products table...\n");

  try {
    // Create the table using SQL
    const { data, error } = await supabase.rpc("exec_sql", {
      sql: `
        CREATE TABLE IF NOT EXISTS customer_portal_products (
          id SERIAL PRIMARY KEY,
          product_id INTEGER NOT NULL UNIQUE,
          name VARCHAR(255) NOT NULL,
          display_title VARCHAR(255),
          description TEXT,
          image_url VARCHAR(500),
          texture_photo_url VARCHAR(500),
          pay_and_pickup_description TEXT,
          pay_and_pickup_display_order INTEGER DEFAULT 0,
          is_pay_and_pickup_enabled BOOLEAN DEFAULT false,
          active BOOLEAN DEFAULT true,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          size_price_options JSONB DEFAULT '[]'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `,
    });

    if (error) {
      console.error("❌ Error creating table:", error.message);
      return;
    }

    console.log("✅ Table created successfully");

    // Create indexes
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_customer_portal_products_pay_and_pickup ON customer_portal_products (is_pay_and_pickup_enabled, pay_and_pickup_display_order);",
      "CREATE INDEX IF NOT EXISTS idx_customer_portal_products_active ON customer_portal_products (active);",
      "CREATE INDEX IF NOT EXISTS idx_customer_portal_products_product_id ON customer_portal_products (product_id);",
    ];

    for (const indexSql of indexes) {
      const { error: indexError } = await supabase.rpc("exec_sql", { sql: indexSql });
      if (indexError) {
        console.error("❌ Error creating index:", indexError.message);
      } else {
        console.log("✅ Index created");
      }
    }

    console.log("\n🎉 Customer portal products table setup complete!");
  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

createCustomerPortalTable();



