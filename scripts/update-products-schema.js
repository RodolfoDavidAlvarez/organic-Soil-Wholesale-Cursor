import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateProductsSchema() {
  console.log('🔄 Updating products table schema...');

  const queries = [
    {
      name: 'size_price_options',
      sql: `
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'products' 
                AND column_name = 'size_price_options'
            ) THEN
                ALTER TABLE products ADD COLUMN size_price_options JSONB;
                RAISE NOTICE 'Added size_price_options column';
            ELSE
                RAISE NOTICE 'Column size_price_options already exists';
            END IF;
        END $$;
      `
    },
    {
      name: 'available_size_options',
      sql: `
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'products' 
                AND column_name = 'available_size_options'
            ) THEN
                ALTER TABLE products ADD COLUMN available_size_options TEXT[];
                RAISE NOTICE 'Added available_size_options column';
            ELSE
                RAISE NOTICE 'Column available_size_options already exists';
            END IF;
        END $$;
      `
    },
    {
      name: 'pay_and_pickup_display_order',
      sql: `
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'products' 
                AND column_name = 'pay_and_pickup_display_order'
            ) THEN
                ALTER TABLE products ADD COLUMN pay_and_pickup_display_order INTEGER DEFAULT 0;
                RAISE NOTICE 'Added pay_and_pickup_display_order column';
            ELSE
                RAISE NOTICE 'Column pay_and_pickup_display_order already exists';
            END IF;
        END $$;
      `
    },
    {
      name: 'catalog_display_order',
      sql: `
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'products' 
                AND column_name = 'catalog_display_order'
            ) THEN
                ALTER TABLE products ADD COLUMN catalog_display_order INTEGER DEFAULT 0;
                RAISE NOTICE 'Added catalog_display_order column';
            ELSE
                RAISE NOTICE 'Column catalog_display_order already exists';
            END IF;
        END $$;
      `
    },
    {
      name: 'is_catalog_enabled',
      sql: `
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'products' 
                AND column_name = 'is_catalog_enabled'
            ) THEN
                ALTER TABLE products ADD COLUMN is_catalog_enabled BOOLEAN DEFAULT true;
                RAISE NOTICE 'Added is_catalog_enabled column';
            ELSE
                RAISE NOTICE 'Column is_catalog_enabled already exists';
            END IF;
        END $$;
      `
    },
    {
      name: 'is_pay_and_pickup_enabled',
      sql: `
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'products' 
                AND column_name = 'is_pay_and_pickup_enabled'
            ) THEN
                ALTER TABLE products ADD COLUMN is_pay_and_pickup_enabled BOOLEAN DEFAULT false;
                RAISE NOTICE 'Added is_pay_and_pickup_enabled column';
            ELSE
                RAISE NOTICE 'Column is_pay_and_pickup_enabled already exists';
            END IF;
        END $$;
      `
    },
    {
      name: 'pay_and_pickup_description',
      sql: `
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'products' 
                AND column_name = 'pay_and_pickup_description'
            ) THEN
                ALTER TABLE products ADD COLUMN pay_and_pickup_description TEXT;
                RAISE NOTICE 'Added pay_and_pickup_description column';
            ELSE
                RAISE NOTICE 'Column pay_and_pickup_description already exists';
            END IF;
        END $$;
      `
    },
    {
      name: 'pay_and_pickup_hero_image',
      sql: `
        DO $$ 
        BEGIN 
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = 'products' 
                AND column_name = 'pay_and_pickup_hero_image'
            ) THEN
                ALTER TABLE products ADD COLUMN pay_and_pickup_hero_image TEXT;
                RAISE NOTICE 'Added pay_and_pickup_hero_image column';
            ELSE
                RAISE NOTICE 'Column pay_and_pickup_hero_image already exists';
            END IF;
        END $$;
      `
    }
  ];

  for (const query of queries) {
    try {
      console.log(`📋 Checking ${query.name} column...`);
      const { error } = await supabase.rpc('exec_sql', { sql: query.sql });
      
      if (error) {
        console.error(`❌ Error updating ${query.name}:`, error);
      } else {
        console.log(`✅ Successfully processed ${query.name}`);
      }
    } catch (err) {
      console.error(`❌ Exception processing ${query.name}:`, err);
    }
  }

  console.log('🎉 Schema update complete!');
}

updateProductsSchema().catch(console.error);