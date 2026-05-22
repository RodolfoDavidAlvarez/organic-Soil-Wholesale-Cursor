/**
 * Migration: Products & Inventory System
 * Creates ops_ingredients, ops_product_ingredients, ops_ingredient_inventory,
 * ops_purchase_orders, ops_purchase_order_items tables
 */
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

async function runMigration() {
  await client.connect();
  console.log('=== Running Products & Inventory Migrations ===\n');

  const tables = [
    {
      name: 'ops_ingredients',
      sql: `
        CREATE TABLE IF NOT EXISTS ops_ingredients (
          id SERIAL PRIMARY KEY,
          airtable_id TEXT UNIQUE,
          ingr_id TEXT,
          name TEXT NOT NULL,
          type TEXT DEFAULT 'ingredient',
          cost_text TEXT,
          cost_per_ton NUMERIC(12,2),
          supplier_name TEXT,
          supplier_contact TEXT,
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    {
      name: 'ops_product_ingredients',
      sql: `
        CREATE TABLE IF NOT EXISTS ops_product_ingredients (
          id SERIAL PRIMARY KEY,
          product_cache_id INTEGER NOT NULL,
          ingredient_id INTEGER NOT NULL,
          ratio_percent NUMERIC(6,2),
          weight_per_batch_lbs NUMERIC(10,2),
          batch_total_lbs NUMERIC(10,2),
          ratio_type TEXT DEFAULT 'percent',
          sort_order INTEGER DEFAULT 0,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(product_cache_id, ingredient_id)
        );
      `
    },
    {
      name: 'ops_ingredient_inventory',
      sql: `
        CREATE TABLE IF NOT EXISTS ops_ingredient_inventory (
          id SERIAL PRIMARY KEY,
          ingredient_id INTEGER NOT NULL REFERENCES ops_ingredients(id),
          quantity_lbs NUMERIC(12,2) DEFAULT 0,
          location TEXT DEFAULT 'main',
          last_updated_by TEXT,
          last_counted_at TIMESTAMPTZ,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(ingredient_id, location)
        );
      `
    },
    {
      name: 'ops_purchase_orders',
      sql: `
        CREATE TABLE IF NOT EXISTS ops_purchase_orders (
          id SERIAL PRIMARY KEY,
          po_number TEXT NOT NULL UNIQUE,
          supplier_name TEXT,
          status TEXT DEFAULT 'draft',
          order_date TIMESTAMPTZ DEFAULT NOW(),
          expected_delivery DATE,
          total_estimated_cost NUMERIC(12,2),
          auto_generated BOOLEAN DEFAULT false,
          notes TEXT,
          created_by TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    },
    {
      name: 'ops_purchase_order_items',
      sql: `
        CREATE TABLE IF NOT EXISTS ops_purchase_order_items (
          id SERIAL PRIMARY KEY,
          purchase_order_id INTEGER NOT NULL REFERENCES ops_purchase_orders(id) ON DELETE CASCADE,
          ingredient_id INTEGER NOT NULL REFERENCES ops_ingredients(id),
          quantity_lbs NUMERIC(12,2) NOT NULL,
          unit_cost NUMERIC(10,2),
          total_cost NUMERIC(12,2),
          received_quantity_lbs NUMERIC(12,2) DEFAULT 0,
          notes TEXT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    }
  ];

  let success = 0;
  for (const table of tables) {
    try {
      console.log(`Creating ${table.name}...`);
      await client.query(table.sql);
      console.log(`  ✓ ${table.name} created`);
      success++;
    } catch (err) {
      console.error(`  ✗ ${table.name} failed:`, err.message);
    }
  }

  console.log(`\n=== Done: ${success}/${tables.length} tables created ===`);
  await client.end();
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  client.end();
  process.exit(1);
});
