#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumns() {
  console.log('Adding missing columns to products table...');

  try {
    // Using PostgreSQL client directly via connection string
    const { Client } = await import('pg');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
    });

    await client.connect();
    console.log('Connected to database');

    // Add missing columns
    const alterQueries = [
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS slug text;',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS catalog_display_order integer DEFAULT 0;',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS is_pay_and_pickup_enabled boolean DEFAULT false;',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS pay_and_pickup_display_order integer DEFAULT 0;',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS pay_and_pickup_description text;',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS pay_and_pickup_hero_image text;',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS is_catalog_enabled boolean DEFAULT true;',
    ];

    for (const query of alterQueries) {
      try {
        await client.query(query);
        console.log(`✓ ${query}`);
      } catch (error) {
        console.error(`✗ ${query}`, error.message);
      }
    }

    // Create indexes
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);',
      'CREATE INDEX IF NOT EXISTS idx_products_catalog_order ON products(catalog_display_order);',
      'CREATE INDEX IF NOT EXISTS idx_products_pay_pickup_order ON products(pay_and_pickup_display_order);',
      'CREATE INDEX IF NOT EXISTS idx_products_catalog_enabled ON products(is_catalog_enabled);',
      'CREATE INDEX IF NOT EXISTS idx_products_pay_pickup_enabled ON products(is_pay_and_pickup_enabled);',
      'DROP INDEX IF EXISTS idx_products_slug_unique;',
      'CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique ON products(slug) WHERE slug IS NOT NULL;',
    ];

    for (const query of indexQueries) {
      try {
        await client.query(query);
        console.log(`✓ ${query}`);
      } catch (error) {
        console.error(`✗ ${query}`, error.message);
      }
    }

    await client.end();
    console.log('Database schema updated successfully!');

  } catch (error) {
    console.error('Failed to add columns:', error);
    process.exit(1);
  }
}

addColumns();