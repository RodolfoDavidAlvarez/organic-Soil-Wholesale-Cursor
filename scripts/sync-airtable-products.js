// Direct sync script for Airtable products to Supabase
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// Requires AIRTABLE_API_KEY env var
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
if (!AIRTABLE_API_KEY) {
  console.error('AIRTABLE_API_KEY environment variable is required');
  process.exit(1);
}
const SSW1_BASE_ID = "appDCKrxtJ7oG9O19";
const PRODUCTS_TABLE_ID = "tbltXMzV96FnmrjFw";
const SIZE_CATEGORIES_TABLE_ID = "tblkNN71Iiyh2GjEi";

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateSizeCategoryCode(name) {
  const lower = name.toLowerCase();
  if (lower.includes("9 lb") || lower.includes("9lb")) return "9lb";
  if (lower.includes("7.5 qt") || lower.includes("7.5qt")) return "7.5qt";
  if (lower.includes("1.5 cf") || lower.includes("1.5cf")) return "1.5cf";
  if (lower.includes("2 cf") || lower.includes("2cf")) return "2cf";
  if (lower.includes("1 cf") || lower.includes("1cf")) return "1cf";
  if (lower.includes("tote") || lower.includes("super sack")) return "tote";
  if (lower.includes("bulk") || lower.includes("cubic yard")) return "bulk";
  return lower.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 20);
}

async function fetchFromAirtable(tableId) {
  const records = [];
  let offset = null;
  do {
    const url = `https://api.airtable.com/v0/${SSW1_BASE_ID}/${tableId}?pageSize=100${offset ? `&offset=${offset}` : ''}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_API_KEY}` },
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Airtable error: ${response.status} - ${text}`);
    }
    const data = await response.json();
    records.push(...(data.records || []));
    offset = data.offset || null;
  } while (offset);
  return records;
}

async function syncProducts() {
  console.log("Fetching products from Airtable...");
  const records = await fetchFromAirtable(PRODUCTS_TABLE_ID);
  console.log(`Found ${records.length} products in Airtable`);

  let synced = 0;
  for (const record of records) {
    const fields = record.fields || {};
    const productData = {
      airtable_id: record.id,
      product_name: fields["Product Name "] || fields["Product Name"] || fields["Name"] || "Unknown",
      product_id: fields["Product ID"] || null,
      ingredient_ratios: fields["Ingredient Ratios"] || null,
      ingredients_list: Array.isArray(fields["Ingredients"]) ? fields["Ingredients"].join(", ") : fields["Ingredients"] || null,
      size_categories: Array.isArray(fields["Size Categories"]) ? fields["Size Categories"] : [],
      certifications: Array.isArray(fields["Certifications"]) ? fields["Certifications"] : [],
      last_synced_at: new Date().toISOString(),
    };

    console.log(`  - ${productData.product_name} (${productData.product_id || 'no ID'})`);
    if (productData.ingredient_ratios) {
      console.log(`    Ratios: ${productData.ingredient_ratios}`);
    }

    const { error } = await supabase
      .from('ops_products_cache')
      .upsert(productData, { onConflict: 'airtable_id' });

    if (error) {
      console.error(`    ERROR: ${error.message}`);
    } else {
      synced++;
    }
  }
  return synced;
}

async function syncSizeCategories() {
  console.log("\nFetching size categories from Airtable...");
  const records = await fetchFromAirtable(SIZE_CATEGORIES_TABLE_ID);
  console.log(`Found ${records.length} size categories in Airtable`);

  let synced = 0;
  for (const record of records) {
    const fields = record.fields || {};
    const name = fields["Name"] || "Unknown";
    const categoryData = {
      airtable_id: record.id,
      name: name,
      code: generateSizeCategoryCode(name),
      units_per_pallet: fields["Units per pallet"] || null,
      estimated_pallet_weight: fields["Estimated pallet weight"] || null,
      illustration_url: Array.isArray(fields["Size category illustration"]) && fields["Size category illustration"][0]
        ? fields["Size category illustration"][0].url : null,
      pallet_configuration: fields["Pallet Configuration"] || null,
      last_synced_at: new Date().toISOString(),
    };

    console.log(`  - ${name} (${categoryData.code}) - ${categoryData.units_per_pallet || 'N/A'} units/pallet`);

    const { error } = await supabase
      .from('ops_size_categories_cache')
      .upsert(categoryData, { onConflict: 'airtable_id' });

    if (error) {
      console.error(`    ERROR: ${error.message}`);
    } else {
      synced++;
    }
  }
  return synced;
}

async function main() {
  console.log("=== Airtable to Supabase Sync ===\n");

  try {
    const productsSynced = await syncProducts();
    console.log(`\nProducts synced: ${productsSynced}`);

    const categoriesSynced = await syncSizeCategories();
    console.log(`Size categories synced: ${categoriesSynced}`);

    console.log("\n=== Sync Complete ===");
  } catch (error) {
    console.error("Sync failed:", error.message);
    process.exit(1);
  }
}

main();
