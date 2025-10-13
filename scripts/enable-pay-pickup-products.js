#!/usr/bin/env node

/**
 * Script to enable products for pay-and-pickup
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

// Products to enable for pay-and-pickup (popular ones)
const productsToEnable = [
  { id: 1000, name: "Dan's Gold", displayOrder: 1 },
  { id: 1001, name: "Mikey's Worm Poop", displayOrder: 2 },
  { id: 2000, name: "Ready Go Garden", displayOrder: 3 },
  { id: 2001, name: "CannaBag", displayOrder: 4 },
  { id: 3000, name: "Nature's Blanket Premium Mulch", displayOrder: 5 },
  { id: 1002, name: "Amazonian Dark Earth", displayOrder: 6 },
  { id: 1003, name: "Tee Top Divot Repair Blend", displayOrder: 7 },
  { id: 1004, name: "Turf Daddy Blend", displayOrder: 8 },
];

async function enableProductsForPayAndPickup() {
  console.log("🚀 Enabling products for pay-and-pickup...\n");

  try {
    for (const product of productsToEnable) {
      console.log(`📦 Enabling ${product.name} (ID: ${product.id})...`);

      const { data, error } = await supabase
        .from("products")
        .update({
          is_pay_and_pickup_enabled: true,
          pay_and_pickup_display_order: product.displayOrder,
          pay_and_pickup_description: `Premium ${product.name} - Ready for immediate pickup at our Phoenix warehouse.`,
          active: true,
        })
        .eq("id", product.id)
        .select();

      if (error) {
        console.error(`❌ Error updating ${product.name}:`, error.message);
      } else {
        console.log(`✅ ${product.name} enabled for pay-and-pickup`);
      }
    }

    console.log("\n🎉 Pay-and-pickup products enabled successfully!");

    // Verify the changes
    console.log("\n📋 Verifying enabled products...");
    const { data: enabledProducts, error: verifyError } = await supabase
      .from("products")
      .select("id, name, is_pay_and_pickup_enabled, pay_and_pickup_display_order")
      .eq("is_pay_and_pickup_enabled", true)
      .order("pay_and_pickup_display_order", { ascending: true });

    if (verifyError) {
      console.error("❌ Error verifying products:", verifyError.message);
    } else {
      console.log(`✅ Found ${enabledProducts.length} products enabled for pay-and-pickup:`);
      enabledProducts.forEach((product) => {
        console.log(`   - ${product.name} (Order: ${product.pay_and_pickup_display_order})`);
      });
    }
  } catch (error) {
    console.error("❌ Script error:", error);
  }
}

enableProductsForPayAndPickup();
