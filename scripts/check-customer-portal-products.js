#!/usr/bin/env node

/**
 * Script to check customer portal products table
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

async function checkCustomerPortalProducts() {
  console.log("🔍 Checking customer portal products table...\n");

  try {
    // Check if table exists and get count
    const { count, error: countError } = await supabase.from("customer_portal_products").select("*", { count: "exact", head: true });

    if (countError) {
      console.error("❌ Error checking customer_portal_products table:", countError.message);
      return;
    }

    console.log(`📊 Total products in customer_portal_products: ${count}`);

    // Get pay-and-pickup enabled products
    const { data: payAndPickupProducts, error: payAndPickupError } = await supabase
      .from("customer_portal_products")
      .select("id, name, is_pay_and_pickup_enabled, pay_and_pickup_display_order")
      .eq("is_pay_and_pickup_enabled", true)
      .order("pay_and_pickup_display_order", { ascending: true });

    if (payAndPickupError) {
      console.error("❌ Error fetching pay-and-pickup products:", payAndPickupError.message);
    } else {
      console.log(`\n🛒 Pay-and-pickup enabled products: ${payAndPickupProducts.length}`);
      payAndPickupProducts.forEach((product) => {
        console.log(`   - ${product.name} (Order: ${product.pay_and_pickup_display_order})`);
      });
    }

    // Check main products table for comparison
    const { data: mainProducts, error: mainError } = await supabase
      .from("products")
      .select("id, name, is_pay_and_pickup_enabled, pay_and_pickup_display_order")
      .eq("is_pay_and_pickup_enabled", true)
      .order("pay_and_pickup_display_order", { ascending: true });

    if (mainError) {
      console.error("❌ Error fetching main products:", mainError.message);
    } else {
      console.log(`\n📦 Main products table pay-and-pickup enabled: ${mainProducts.length}`);
      mainProducts.forEach((product) => {
        console.log(`   - ${product.name} (Order: ${product.pay_and_pickup_display_order})`);
      });
    }
  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

checkCustomerPortalProducts();




