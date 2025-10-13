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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminProducts() {
  console.log('🔍 Checking admin product access...\n');

  try {
    // Get all products with basic info
    console.log('📦 Fetching all products...');
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name, display_title, category, is_pay_and_pickup_enabled, is_catalog_enabled')
      .order('id');

    if (error) {
      console.error('❌ Error fetching products:', error);
      return;
    }

    console.log(`✅ Found ${products.length} total products\n`);

    // Show Dan's Gold products specifically
    console.log('🥇 Dan\'s Gold Products:');
    const dansGoldProducts = products.filter(p => 
      p.name.toLowerCase().includes('dan') && p.name.toLowerCase().includes('gold')
    );

    dansGoldProducts.forEach(product => {
      console.log(`  📋 ID ${product.id}: ${product.display_title || product.name}`);
      console.log(`      Admin URL: http://localhost:5001/admin/products/${product.id}`);
      console.log(`      Category: ${product.category || 'None'}`);
      console.log(`      Pay & Pickup: ${product.is_pay_and_pickup_enabled ? '✅ Enabled' : '❌ Disabled'}`);
      console.log(`      Catalog: ${product.is_catalog_enabled ? '✅ Enabled' : '❌ Disabled'}\n`);
    });

    // Show all pay-and-pickup enabled products
    console.log('🚚 Pay & Pickup Enabled Products:');
    const payPickupProducts = products.filter(p => p.is_pay_and_pickup_enabled);
    payPickupProducts.forEach(product => {
      console.log(`  📋 ID ${product.id}: ${product.display_title || product.name}`);
      console.log(`      Admin URL: http://localhost:5001/admin/products/${product.id}\n`);
    });

    // Check for commonly searched product names
    console.log('🔍 Product Search Results:');
    const searchTerms = ['dairy', 'compost', 'organic', 'soil', 'amazonian'];
    
    searchTerms.forEach(term => {
      const matches = products.filter(p => 
        (p.name.toLowerCase().includes(term.toLowerCase()) || 
         (p.display_title && p.display_title.toLowerCase().includes(term.toLowerCase())))
      );
      
      if (matches.length > 0) {
        console.log(`\n  🔍 Products containing "${term}":`);
        matches.forEach(product => {
          console.log(`    ID ${product.id}: ${product.display_title || product.name}`);
        });
      }
    });

    // Show valid ID ranges
    const minId = Math.min(...products.map(p => p.id));
    const maxId = Math.max(...products.map(p => p.id));
    console.log(`\n📊 Valid Product ID Range: ${minId} - ${maxId}`);
    console.log(`❌ Invalid IDs like 1000 will show 404 errors`);

    console.log('\n✅ Admin product access check complete!');

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the check
checkAdminProducts().catch(console.error);