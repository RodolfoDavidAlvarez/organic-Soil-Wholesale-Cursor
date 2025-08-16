import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase configuration in .env file');
  process.exit(1);
}

console.log('🔍 Testing Supabase connection...');
console.log(`URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testDatabase() {
  try {
    // Test 1: Check if we can connect and list tables
    console.log('\n📊 Checking existing tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('products')
      .select('id')
      .limit(1);

    if (tablesError && tablesError.code === '42P01') {
      console.log('❌ Tables do not exist. You need to run the SQL script to create them.');
      console.log('\n📝 Instructions:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to SQL Editor');
      console.log('3. Copy and paste the contents of scripts/create-supabase-tables.sql');
      console.log('4. Click "Run" to execute the script');
      return;
    } else if (tablesError) {
      console.error('❌ Error connecting to database:', tablesError.message);
      return;
    }

    console.log('✅ Successfully connected to Supabase!');

    // Test 2: List all tables
    const { data: tableList, error: listError } = await supabase.rpc('get_tables', {});
    
    if (!listError && tableList) {
      console.log('\n📋 Existing tables:');
      tableList.forEach(table => console.log(`  - ${table.table_name}`));
    }

    // Test 3: Check products table
    const { count: productCount } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true });
    
    console.log(`\n📦 Products table: ${productCount || 0} products`);

    // Test 4: Check orders table
    const { count: orderCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });
    
    console.log(`📋 Orders table: ${orderCount || 0} orders`);

    // Test 5: Check locations table
    const { data: locations } = await supabase
      .from('locations')
      .select('*');
    
    console.log(`📍 Locations table: ${locations?.length || 0} locations`);
    if (locations && locations.length > 0) {
      locations.forEach(loc => console.log(`  - ${loc.name} (${loc.city}, ${loc.state})`));
    }

    console.log('\n✅ Database connection test completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Create a simple RPC function to list tables (if it doesn't exist)
const createTableListFunction = `
CREATE OR REPLACE FUNCTION get_tables()
RETURNS TABLE(table_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT tablename::text
  FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
END;
$$ LANGUAGE plpgsql;
`;

testDatabase();