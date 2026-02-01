/**
 * Run Work Orders Migration
 * Creates the ops_work_orders, ops_products_cache, and ops_size_categories_cache tables
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('Running Work Orders migration...\n');

  // Create ops_work_orders table
  console.log('Creating ops_work_orders table...');
  const { error: woError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS ops_work_orders (
        id SERIAL PRIMARY KEY,
        wo_number TEXT NOT NULL UNIQUE,
        product_type TEXT NOT NULL DEFAULT 'standard',
        product_name TEXT,
        product_id TEXT,
        airtable_product_id TEXT,
        size_category TEXT NOT NULL,
        size_category_name TEXT,
        units_per_pallet INTEGER,
        estimated_pallet_weight TEXT,
        quantity INTEGER NOT NULL,
        quantity_type TEXT DEFAULT 'pallet',
        ingredient_ratios TEXT,
        ingredients_list TEXT,
        mixing_guidelines TEXT,
        total_weight_lbs NUMERIC,
        custom_notes TEXT,
        needs_transportation BOOLEAN DEFAULT FALSE,
        destination_address TEXT,
        destination_city TEXT,
        destination_state TEXT,
        destination_zip TEXT,
        preferred_delivery_date DATE,
        preferred_delivery_time TEXT,
        linked_bol_id INTEGER,
        status TEXT NOT NULL DEFAULT 'pending',
        priority TEXT DEFAULT 'normal',
        created_by TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `
  });

  if (woError) {
    // If RPC doesn't exist, try direct SQL through REST API
    console.log('Note: exec_sql RPC not available, tables may need to be created via Supabase Dashboard');
    console.log('Error:', woError.message);
  } else {
    console.log('✓ ops_work_orders table created');
  }

  // Create indexes
  console.log('Creating indexes...');

  // Create ops_products_cache table
  console.log('Creating ops_products_cache table...');
  const { error: pcError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS ops_products_cache (
        id SERIAL PRIMARY KEY,
        airtable_id TEXT UNIQUE NOT NULL,
        product_name TEXT NOT NULL,
        product_id TEXT,
        ingredient_ratios TEXT,
        ingredients_list TEXT,
        size_categories TEXT[],
        certifications TEXT[],
        last_synced_at TIMESTAMP DEFAULT NOW()
      );
    `
  });

  if (pcError) {
    console.log('Note: ops_products_cache - ', pcError.message);
  } else {
    console.log('✓ ops_products_cache table created');
  }

  // Create ops_size_categories_cache table
  console.log('Creating ops_size_categories_cache table...');
  const { error: scError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS ops_size_categories_cache (
        id SERIAL PRIMARY KEY,
        airtable_id TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        units_per_pallet INTEGER,
        estimated_pallet_weight TEXT,
        illustration_url TEXT,
        pallet_configuration TEXT,
        last_synced_at TIMESTAMP DEFAULT NOW()
      );
    `
  });

  if (scError) {
    console.log('Note: ops_size_categories_cache - ', scError.message);
  } else {
    console.log('✓ ops_size_categories_cache table created');
  }

  console.log('\n=== Migration Summary ===');
  console.log('If you see errors above, please run the SQL manually in Supabase Dashboard:');
  console.log('1. Go to https://supabase.com/dashboard');
  console.log('2. Select your project');
  console.log('3. Go to SQL Editor');
  console.log('4. Copy and run the SQL from: scripts/create-ops-work-orders-tables.sql');
}

runMigration().catch(console.error);
