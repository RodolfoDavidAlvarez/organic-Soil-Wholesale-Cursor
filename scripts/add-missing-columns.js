import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config({ path: '../.env' });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addMissingColumns() {
  console.log('🔄 Adding missing columns to products table...');

  const alterCommands = [
    'ALTER TABLE products ADD COLUMN IF NOT EXISTS size_price_options JSONB;',
    'ALTER TABLE products ADD COLUMN IF NOT EXISTS available_size_options TEXT[];',
    'ALTER TABLE products ADD COLUMN IF NOT EXISTS pay_and_pickup_display_order INTEGER DEFAULT 0;',
    'ALTER TABLE products ADD COLUMN IF NOT EXISTS catalog_display_order INTEGER DEFAULT 0;',
    'ALTER TABLE products ADD COLUMN IF NOT EXISTS is_catalog_enabled BOOLEAN DEFAULT true;',
    'ALTER TABLE products ADD COLUMN IF NOT EXISTS is_pay_and_pickup_enabled BOOLEAN DEFAULT false;',
    'ALTER TABLE products ADD COLUMN IF NOT EXISTS pay_and_pickup_description TEXT;',
    'ALTER TABLE products ADD COLUMN IF NOT EXISTS pay_and_pickup_hero_image TEXT;'
  ];

  for (const command of alterCommands) {
    try {
      console.log(`📋 Executing: ${command}`);
      const { data, error } = await supabase.rpc('exec', {
        sql: command
      });
      
      if (error) {
        console.error(`❌ Error:`, error);
      } else {
        console.log(`✅ Success`);
      }
    } catch (err) {
      console.error(`❌ Exception:`, err);
    }
  }

  // Try to create a function to execute SQL directly
  try {
    console.log('🔧 Creating SQL execution function...');
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION execute_sql(sql_text text)
      RETURNS void AS $$
      BEGIN
        EXECUTE sql_text;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    await supabase.rpc('exec', { sql: createFunctionSQL });
    console.log('✅ Function created successfully');
    
    // Now execute the alter commands
    for (const command of alterCommands) {
      try {
        console.log(`📋 Using function to execute: ${command}`);
        await supabase.rpc('execute_sql', { sql_text: command });
        console.log(`✅ Success with function`);
      } catch (err) {
        console.error(`❌ Function execution error:`, err);
      }
    }
  } catch (err) {
    console.error('❌ Could not create function:', err);
  }

  console.log('🎉 Column addition attempt complete!');
}

addMissingColumns().catch(console.error);