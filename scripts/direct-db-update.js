import pkg from 'pg';
const { Client } = pkg;
import { config } from 'dotenv';
config({ path: '../.env' });

async function updateDatabase() {
  console.log('🔄 Connecting to database...');
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const alterCommands = [
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS size_price_options JSONB;',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS available_size_options TEXT[];',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS pay_and_pickup_display_order INTEGER DEFAULT 0;',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS catalog_display_order INTEGER DEFAULT 0;',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS is_catalog_enabled BOOLEAN DEFAULT true;',
      "ALTER TABLE products ADD COLUMN IF NOT EXISTS product_status TEXT DEFAULT 'active';",
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS is_pay_and_pickup_enabled BOOLEAN DEFAULT false;',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS pay_and_pickup_description TEXT;',
      'ALTER TABLE products ADD COLUMN IF NOT EXISTS pay_and_pickup_hero_image TEXT;'
    ];

    for (const command of alterCommands) {
      try {
        console.log(`📋 Executing: ${command}`);
        await client.query(command);
        console.log(`✅ Success`);
      } catch (err) {
        console.error(`❌ Error executing command: ${err.message}`);
      }
    }

    // Check columns exist
    const checkResult = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      AND column_name IN (
        'size_price_options', 
        'available_size_options',
        'pay_and_pickup_display_order',
        'catalog_display_order',
        'is_catalog_enabled',
        'is_pay_and_pickup_enabled',
        'product_status',
        'pay_and_pickup_description',
        'pay_and_pickup_hero_image'
      )
      ORDER BY column_name;
    `);

    console.log('✅ Current enhanced columns in products table:');
    checkResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}`);
    });

  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await client.end();
    console.log('🎉 Database connection closed');
  }
}

updateDatabase().catch(console.error);
