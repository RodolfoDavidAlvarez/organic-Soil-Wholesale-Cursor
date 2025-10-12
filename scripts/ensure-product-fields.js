#!/usr/bin/env node

/**
 * Script to ensure all product fields exist in the database
 * Run this to verify/create necessary columns for the enhanced product editing system
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Required columns for the enhanced product editing system
const requiredColumns = [
  { name: 'id', type: 'serial PRIMARY KEY' },
  { name: 'name', type: 'text NOT NULL' },
  { name: 'display_title', type: 'text' },
  { name: 'description', type: 'text' },
  { name: 'category', type: 'text' },
  { name: 'price', type: 'integer' },
  { name: 'stock_quantity', type: 'integer DEFAULT 0' },
  { name: 'image_url', type: 'text' },
  { name: 'texture_photo_url', type: 'text' },
  { name: 'ingredients', type: 'text' },
  { name: 'target_audience', type: 'text' },
  { name: 'recommended_uses', type: 'text' },
  { name: 'story', type: 'text' },
  { name: 'usage', type: 'text' },
  { name: 'certifications', type: 'text' },
  { name: 'features', type: 'text' },
  { name: 'size_options', type: 'text' },
  { name: 'product_type', type: 'text' },
  { name: 'safety_precautions', type: 'text' },
  { name: 'warranty', type: 'text' },
  { name: 'marketing_title', type: 'text' },
  { name: 'seo_keywords', type: 'text' },
  { name: 'marketing_note', type: 'text' },
  { name: 'product_video_url', type: 'text' },
  { name: 'product_video_title', type: 'text' },
  { name: 'is_wholesale_only', type: 'boolean DEFAULT false' },
  { name: 'additional_images', type: 'text[]' },
  { name: 'is_catalog_enabled', type: 'boolean DEFAULT true' },
  { name: 'catalog_display_order', type: 'integer DEFAULT 0' },
  { name: 'pay_and_pickup_display_order', type: 'integer DEFAULT 0' },
  { name: 'allow_bulk_pickup', type: 'boolean DEFAULT false' },
  { name: 'available_size_options', type: 'text[]' },
  { name: 'size_price_options', type: 'jsonb' },
  { name: 'min_order_quantity', type: 'integer DEFAULT 1' },
  { name: 'max_order_quantity', type: 'integer' },
  { name: 'is_price_negotiable', type: 'boolean DEFAULT false' },
  { name: 'requires_quote', type: 'boolean DEFAULT false' },
  { name: 'is_pay_and_pickup_enabled', type: 'boolean DEFAULT false' },
  { name: 'pay_and_pickup_description', type: 'text' },
  { name: 'pay_and_pickup_hero_image', type: 'text' },
  { name: 'pay_and_pickup_badge', type: 'text' },
  { name: 'created_at', type: 'timestamp with time zone DEFAULT now()' },
  { name: 'updated_at', type: 'timestamp with time zone DEFAULT now()' }
];

async function checkAndCreateColumns() {
  console.log('🔍 Checking products table structure...');
  
  try {
    // Get current table structure
    const { data: columns, error } = await supabase
      .rpc('get_table_columns', { table_name: 'products' });
    
    if (error && error.message.includes('function get_table_columns() does not exist')) {
      console.log('📝 Creating helper function to check table structure...');
      
      // Create a helper function to get table columns
      const { error: createFunctionError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
          RETURNS TABLE(column_name text, data_type text, is_nullable text)
          LANGUAGE sql
          AS $$
            SELECT 
              column_name::text,
              data_type::text,
              is_nullable::text
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = $1
            ORDER BY ordinal_position;
          $$;
        `
      });
      
      if (createFunctionError) {
        console.error('❌ Failed to create helper function:', createFunctionError);
        // Fallback: just try to ensure the table exists with basic structure
        console.log('🔧 Attempting basic table creation...');
        await ensureBasicTable();
        return;
      }
      
      // Try again to get columns
      const { data: newColumns, error: newError } = await supabase
        .rpc('get_table_columns', { table_name: 'products' });
        
      if (newError) {
        console.error('❌ Still failed to get columns:', newError);
        await ensureBasicTable();
        return;
      }
      
      columns = newColumns;
    } else if (error) {
      console.error('❌ Error checking table structure:', error);
      await ensureBasicTable();
      return;
    }
    
    const existingColumns = new Set(columns?.map(col => col.column_name) || []);
    console.log(`📋 Found ${existingColumns.size} existing columns`);
    
    // Check which columns need to be added
    const missingColumns = requiredColumns.filter(col => !existingColumns.has(col.name));
    
    if (missingColumns.length === 0) {
      console.log('✅ All required columns exist!');
      return;
    }
    
    console.log(`🔧 Adding ${missingColumns.length} missing columns...`);
    
    for (const column of missingColumns) {
      try {
        console.log(`  Adding column: ${column.name} (${column.type})`);
        
        const { error: alterError } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE products ADD COLUMN IF NOT EXISTS ${column.name} ${column.type};`
        });
        
        if (alterError) {
          console.warn(`⚠️  Warning adding column ${column.name}:`, alterError.message);
        } else {
          console.log(`    ✅ Added ${column.name}`);
        }
      } catch (err) {
        console.warn(`⚠️  Failed to add column ${column.name}:`, err.message);
      }
    }
    
    console.log('🎉 Database schema update completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    await ensureBasicTable();
  }
}

async function ensureBasicTable() {
  console.log('🔧 Ensuring basic products table exists...');
  
  try {
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS products (
          id serial PRIMARY KEY,
          name text NOT NULL,
          display_title text,
          description text,
          category text,
          price integer,
          stock_quantity integer DEFAULT 0,
          image_url text,
          texture_photo_url text,
          ingredients text,
          target_audience text,
          recommended_uses text,
          story text,
          usage text,
          certifications text,
          features text,
          size_options text,
          product_type text,
          safety_precautions text,
          warranty text,
          marketing_title text,
          seo_keywords text,
          marketing_note text,
          product_video_url text,
          product_video_title text,
          is_wholesale_only boolean DEFAULT false,
          additional_images text[],
          is_catalog_enabled boolean DEFAULT true,
          catalog_display_order integer DEFAULT 0,
          pay_and_pickup_display_order integer DEFAULT 0,
          allow_bulk_pickup boolean DEFAULT false,
          available_size_options text[],
          size_price_options jsonb,
          min_order_quantity integer DEFAULT 1,
          max_order_quantity integer,
          is_price_negotiable boolean DEFAULT false,
          requires_quote boolean DEFAULT false,
          is_pay_and_pickup_enabled boolean DEFAULT false,
          pay_and_pickup_description text,
          pay_and_pickup_hero_image text,
          pay_and_pickup_badge text,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now()
        );
        
        -- Create updated_at trigger
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = now();
          RETURN NEW;
        END;
        $$ language 'plpgsql';
        
        DROP TRIGGER IF EXISTS update_products_updated_at ON products;
        CREATE TRIGGER update_products_updated_at
          BEFORE UPDATE ON products
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
      `
    });
    
    if (error) {
      console.error('❌ Failed to create basic table:', error);
    } else {
      console.log('✅ Basic products table ensured');
    }
  } catch (err) {
    console.error('❌ Error creating basic table:', err);
  }
}

async function testConnection() {
  console.log('🔌 Testing database connection...');
  
  try {
    const { data, error } = await supabase
      .from('products')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (err) {
    console.error('❌ Database connection error:', err.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting database schema verification...\n');
  
  const isConnected = await testConnection();
  if (!isConnected) {
    console.log('\n❌ Cannot proceed without database connection');
    process.exit(1);
  }
  
  await checkAndCreateColumns();
  
  console.log('\n✅ Database schema verification completed!');
  console.log('\n📝 Next steps:');
  console.log('   1. Test the product editing interface');
  console.log('   2. Upload some images to verify the upload system');
  console.log('   3. Save product changes to test the complete workflow');
}

main().catch(console.error);
