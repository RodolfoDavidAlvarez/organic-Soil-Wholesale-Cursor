import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExistingTables() {
  console.log('🔍 Checking existing tables in Supabase...\n');
  
  const requiredTables = [
    'products',
    'inventory',
    'locations',
    'orders',
    'order_items',
    'admin_users',
    'admin_sessions',
    'audit_logs',
    'contact_messages',
    'notification_preferences',
    'drive_through_queue',
    'order_status_history',
    'notification_log',
    'inventory_alerts',
    'pricing_tiers',
    'customer_drive_through_preferences'
  ];
  
  const existingTables: string[] = [];
  const missingTables: string[] = [];
  
  for (const table of requiredTables) {
    try {
      // Try to select from the table
      const { error } = await supabase.from(table).select('*').limit(0);
      
      if (error && error.message.includes('Could not find the table')) {
        missingTables.push(table);
        console.log(`❌ ${table} - NOT FOUND`);
      } else if (error) {
        console.log(`⚠️  ${table} - ERROR: ${error.message}`);
      } else {
        existingTables.push(table);
        console.log(`✅ ${table} - EXISTS`);
      }
    } catch (err: any) {
      missingTables.push(table);
      console.log(`❌ ${table} - ERROR: ${err.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Summary:`);
  console.log(`   ✅ Tables found: ${existingTables.length}`);
  console.log(`   ❌ Tables missing: ${missingTables.length}`);
  
  if (missingTables.length > 0) {
    console.log('\n⚠️  Missing tables:');
    missingTables.forEach(table => console.log(`   - ${table}`));
    
    console.log('\n🔧 Next steps:');
    console.log('   1. Go to Supabase Dashboard SQL Editor');
    console.log('   2. Run scripts/create-supabase-tables.sql');
    console.log('   3. Run scripts/drive-through-enhancements.sql');
    console.log('   4. Run this check again');
  } else {
    console.log('\n✅ All required tables exist!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Run: npx tsx scripts/seedCompleteProductDatabase.ts');
    console.log('   2. Run: npx tsx scripts/updatePricingFromHTML.ts');
  }
  
  // Check if we have any data
  if (existingTables.includes('products')) {
    const { count } = await supabase.from('products').select('*', { count: 'exact', head: true });
    console.log(`\n📦 Products in database: ${count || 0}`);
  }
  
  if (existingTables.includes('inventory')) {
    const { count } = await supabase.from('inventory').select('*', { count: 'exact', head: true });
    console.log(`📦 Inventory items: ${count || 0}`);
  }
  
  if (existingTables.includes('pricing_tiers')) {
    const { count } = await supabase.from('pricing_tiers').select('*', { count: 'exact', head: true });
    console.log(`💰 Pricing tiers: ${count || 0}`);
  }
}

// Run the check
checkExistingTables().catch(console.error);