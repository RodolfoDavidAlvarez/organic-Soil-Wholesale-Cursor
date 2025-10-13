import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    envVars[key] = valueParts.join('=');
  }
});

const supabaseUrl = envVars.SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProductsSchema() {
  console.log('🔍 Checking products table schema...\n');

  try {
    // Get first product to see available columns
    const { data: sampleProduct, error } = await supabase
      .from('products')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('❌ Error fetching sample product:', error);
      return;
    }

    console.log('📋 Available columns in products table:');
    const columns = Object.keys(sampleProduct).sort();
    columns.forEach(col => {
      console.log(`  - ${col}: ${typeof sampleProduct[col]} (${sampleProduct[col] === null ? 'null' : sampleProduct[col]})`);
    });

    // Now get all products with available columns
    console.log('\n📦 Fetching Dan\'s Gold products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, display_title, category, is_pay_and_pickup_enabled')
      .ilike('name', '%dan%gold%')
      .order('id');

    if (productsError) {
      console.error('❌ Error fetching Dan\'s Gold products:', productsError);
      return;
    }

    console.log(`\n🥇 Found ${products.length} Dan's Gold products:`);
    products.forEach(product => {
      console.log(`\n  📋 Product ID ${product.id}:`);
      console.log(`      Name: ${product.name}`);
      console.log(`      Display Title: ${product.display_title || 'None'}`);
      console.log(`      Category: ${product.category || 'None'}`);
      console.log(`      Pay & Pickup: ${product.is_pay_and_pickup_enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`      👉 Correct Admin URL: http://localhost:5001/admin/products/${product.id}`);
    });

    // Get all pay-and-pickup products
    console.log('\n🚚 All Pay & Pickup enabled products:');
    const { data: allProducts, error: allError } = await supabase
      .from('products')
      .select('id, name, display_title, is_pay_and_pickup_enabled')
      .eq('is_pay_and_pickup_enabled', true)
      .order('id');

    if (!allError && allProducts) {
      allProducts.forEach(product => {
        console.log(`  📋 ID ${product.id}: ${product.display_title || product.name}`);
        console.log(`      Admin URL: http://localhost:5001/admin/products/${product.id}`);
      });
    }

    // Check ID ranges
    const { data: idRange, error: idError } = await supabase
      .from('products')
      .select('id')
      .order('id');

    if (!idError && idRange) {
      const ids = idRange.map(p => p.id);
      console.log(`\n📊 Valid Product IDs: ${Math.min(...ids)} to ${Math.max(...ids)}`);
      console.log(`❌ Product ID 1000 does NOT exist - that's why you got a 404!`);
    }

  } catch (error) {
    console.error('💥 Fatal error:', error);
  }
}

checkProductsSchema().catch(console.error);