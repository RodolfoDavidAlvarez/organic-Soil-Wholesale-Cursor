import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDatabaseConnection() {
  console.log('🧪 Testing Database Connection and Setup...\n');

  const tests = [
    {
      name: 'Database Connection',
      test: async () => {
        const { data, error } = await supabase.from('products').select('count').limit(1);
        if (error) throw error;
        return 'Connected successfully';
      }
    },
    {
      name: 'Products Table',
      test: async () => {
        const { data, error } = await supabase.from('products').select('id, name').limit(5);
        if (error) throw error;
        return `Found ${data?.length || 0} products`;
      }
    },
    {
      name: 'Inventory Table', 
      test: async () => {
        const { data, error } = await supabase.from('inventory').select('id, product_id, size_option, quantity_available').limit(5);
        if (error) throw error;
        return `Found ${data?.length || 0} inventory items`;
      }
    },
    {
      name: 'Pricing Tiers Table',
      test: async () => {
        const { data, error } = await supabase.from('pricing_tiers').select('id, product_id, tier_name, fixed_price').limit(5);
        if (error) throw error;
        return `Found ${data?.length || 0} pricing tiers`;
      }
    },
    {
      name: 'Drive-Through Queue Table',
      test: async () => {
        const { data, error } = await supabase.from('drive_through_queue').select('id').limit(1);
        if (error) throw error;
        return 'Table exists and accessible';
      }
    },
    {
      name: 'Notification Preferences Table',
      test: async () => {
        const { data, error } = await supabase.from('notification_preferences').select('id').limit(1);
        if (error) throw error;
        return 'Table exists and accessible';
      }
    },
    {
      name: 'Inventory Alerts Table',
      test: async () => {
        const { data, error } = await supabase.from('inventory_alerts').select('id').limit(1);
        if (error) throw error;
        return 'Table exists and accessible';
      }
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const { name, test } of tests) {
    try {
      const result = await test();
      console.log(`✅ ${name}: ${result}`);
      passedTests++;
    } catch (error) {
      console.log(`❌ ${name}: ${error.message}`);
      failedTests++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passedTests} passed, ${failedTests} failed`);
  
  if (failedTests === 0) {
    console.log('🎉 All tests passed! Database is ready for the drive-through system.');
    
    // Show sample data
    console.log('\n📋 Sample Data:');
    try {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, category')
        .limit(3);
      
      if (products && products.length > 0) {
        console.log('\n🌱 Sample Products:');
        products.forEach(p => console.log(`  - ${p.name} (${p.category})`));
      }

      const { data: inventory } = await supabase
        .from('inventory')
        .select('size_option, quantity_available, price, products(name)')
        .limit(3);

      if (inventory && inventory.length > 0) {
        console.log('\n📦 Sample Inventory:');
        inventory.forEach(i => console.log(`  - ${i.products?.name}: ${i.size_option} - ${i.quantity_available} units at $${i.price}`));
      }

      const { data: pricing } = await supabase
        .from('pricing_tiers')
        .select('tier_name, min_quantity, fixed_price, products(name)')
        .limit(3);

      if (pricing && pricing.length > 0) {
        console.log('\n💰 Sample Pricing:');
        pricing.forEach(p => console.log(`  - ${p.products?.name}: ${p.tier_name} (${p.min_quantity}+) = $${p.fixed_price}`));
      }

    } catch (error) {
      console.log('⚠️  Could not fetch sample data:', error.message);
    }
  } else {
    console.log('\n❌ Some tests failed. Please check the database setup.');
    console.log('\n🔧 Next Steps:');
    console.log('1. Run the SQL files in Supabase Dashboard');
    console.log('2. Execute seedCompleteProductDatabase.ts');
    console.log('3. Execute updatePricingFromHTML.ts');
    console.log('4. Run this test again');
  }

  console.log('\n' + '='.repeat(50));
}

// Run the test
testDatabaseConnection();