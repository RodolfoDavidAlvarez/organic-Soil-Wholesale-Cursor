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

async function fixProductPricing() {
  console.log('🔧 Starting product pricing fix...');

  try {
    // Step 1: Add size_price_options column if it doesn't exist
    console.log('📋 Adding size_price_options column...');
    const { error: alterError } = await supabase.rpc('sql', {
      query: `
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'products' 
              AND column_name = 'size_price_options'
          ) THEN
            ALTER TABLE products ADD COLUMN size_price_options JSONB DEFAULT '[]'::jsonb;
            CREATE INDEX idx_products_size_price_options ON products USING gin (size_price_options);
            RAISE NOTICE 'Added size_price_options column and index';
          ELSE
            RAISE NOTICE 'Column size_price_options already exists';
          END IF;
        END
        $$;
      `
    });

    if (alterError) {
      console.error('❌ Error adding column:', alterError);
      throw alterError;
    }

    // Step 2: Get all pay-and-pickup enabled products
    console.log('📦 Fetching pay-and-pickup products...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, display_title, is_pay_and_pickup_enabled')
      .eq('is_pay_and_pickup_enabled', true);

    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      throw productsError;
    }

    console.log(`📊 Found ${products.length} pay-and-pickup products`);

    // Step 3: For each product, get inventory and build size_price_options
    for (const product of products) {
      console.log(`🔄 Processing product ${product.id}: ${product.display_title || product.name}`);

      // Get inventory for this product
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('size_option, price, quantity_available')
        .eq('product_id', product.id)
        .eq('location_id', 1)  // Phoenix location
        .gt('price', 0)
        .gt('quantity_available', 0)
        .order('price');

      if (inventoryError) {
        console.error(`❌ Error fetching inventory for product ${product.id}:`, inventoryError);
        continue;
      }

      if (inventory.length === 0) {
        console.log(`⚠️  No inventory found for product ${product.id}, skipping...`);
        continue;
      }

      // Build size_price_options array
      const sizeOptions = inventory.map((inv, index) => {
        const key = inv.size_option.toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[()]/g, '');

        return {
          key,
          label: inv.size_option,
          price: parseFloat(inv.price.toFixed(2)),
          price_cents: Math.round(inv.price * 100),
          is_active: true,
          display_order: getSizeDisplayOrder(inv.size_option, index)
        };
      });

      // Update product with size_price_options
      const { error: updateError } = await supabase
        .from('products')
        .update({
          size_price_options: sizeOptions,
          available_size_options: sizeOptions.map(opt => opt.label)
        })
        .eq('id', product.id);

      if (updateError) {
        console.error(`❌ Error updating product ${product.id}:`, updateError);
      } else {
        console.log(`✅ Updated product ${product.id} with ${sizeOptions.length} size options`);
        console.log(`   Prices: ${sizeOptions.map(opt => `${opt.label}: $${opt.price}`).join(', ')}`);
      }
    }

    // Step 4: Verify results
    console.log('🔍 Verifying results...');
    const { data: updatedProducts, error: verifyError } = await supabase
      .from('products')
      .select('id, name, display_title, size_price_options, available_size_options')
      .eq('is_pay_and_pickup_enabled', true)
      .not('size_price_options', 'is', null);

    if (verifyError) {
      console.error('❌ Error verifying results:', verifyError);
    } else {
      console.log('\n📊 Updated Products Summary:');
      updatedProducts.forEach(product => {
        const sizeCount = product.size_price_options ? product.size_price_options.length : 0;
        const pricing = product.size_price_options 
          ? product.size_price_options.map(opt => `${opt.label}: $${opt.price}`).join(', ')
          : 'No pricing';
        
        console.log(`   ${product.id}: ${product.display_title || product.name}`);
        console.log(`      ${sizeCount} sizes: ${pricing}`);
      });
    }

    console.log('\n✅ Product pricing fix completed successfully!');
    console.log('🌐 The pay-and-pickup menu should now show correct pricing.');

  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

function getSizeDisplayOrder(sizeOption, fallbackIndex) {
  const orderMap = {
    '9lb Bag': 1,
    '25lb Bag': 2,
    '1 CF Bag': 3,
    'Bulk (50lb)': 4,
    'Bulk Pickup': 5,
    'Bulk Delivery': 6
  };
  
  return orderMap[sizeOption] || (10 + fallbackIndex);
}

// Run the fix
fixProductPricing().catch(console.error);