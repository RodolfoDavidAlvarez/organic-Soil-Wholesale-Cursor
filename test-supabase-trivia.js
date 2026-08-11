import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://govktyrtmwzbzqkmzmrf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to test trivia storage');
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Testing Supabase connection for trivia leads...\n');

async function testDatabase() {
  // Test 1: Check if table exists
  console.log('1. Checking if trivia_leads table exists...');
  const { data: tables, error: tableError } = await supabase
    .from('trivia_leads')
    .select('count')
    .limit(1);
  
  if (tableError) {
    if (tableError.code === '42P01') {
      console.log('❌ Table does not exist. Please run setup-trivia-table.sql in Supabase');
      console.log('   Go to: https://supabase.com/dashboard/project/govktyrtmwzbzqkmzmrf/sql/new');
      return;
    }
    console.log('❌ Error:', tableError.message);
    return;
  }
  
  console.log('✅ Table exists!\n');
  
  // Test 2: Try to insert a test lead
  console.log('2. Testing insert functionality...');
  const testLead = {
    name: 'Test User',
    email: 'test@example.com',
    score: 5,
    interests: ['Vegetables', 'Landscaping'],
    answers: [0, 2, 3, 1, 2]
  };
  
  const { data: insertData, error: insertError } = await supabase
    .from('trivia_leads')
    .insert(testLead)
    .select()
    .single();
  
  if (insertError) {
    console.log('❌ Insert failed:', insertError.message);
    return;
  }
  
  console.log('✅ Test lead inserted successfully!');
  console.log('   ID:', insertData.id);
  console.log('   Name:', insertData.name);
  console.log('   Score:', insertData.score, '\n');
  
  // Test 3: Fetch leaderboard
  console.log('3. Testing leaderboard query...');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const { data: leaderboard, error: leaderError } = await supabase
    .from('trivia_leads')
    .select('name, score, created_at')
    .gte('created_at', today.toISOString())
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (leaderError) {
    console.log('❌ Leaderboard query failed:', leaderError.message);
    return;
  }
  
  console.log('✅ Leaderboard query successful!');
  console.log('   Today\'s top scores:');
  leaderboard.forEach((entry, index) => {
    console.log(`   ${index + 1}. ${entry.name}: ${entry.score}/5`);
  });
  
  // Clean up test data
  console.log('\n4. Cleaning up test data...');
  const { error: deleteError } = await supabase
    .from('trivia_leads')
    .delete()
    .eq('email', 'test@example.com');
  
  if (deleteError) {
    console.log('⚠️  Could not clean up test data:', deleteError.message);
  } else {
    console.log('✅ Test data cleaned up');
  }
  
  console.log('\n🎉 All tests passed! Your trivia database is ready to use.');
}

testDatabase().catch(console.error);
