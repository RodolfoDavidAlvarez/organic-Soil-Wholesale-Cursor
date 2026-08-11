import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://govktyrtmwzbzqkmzmrf.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY is required to create the trivia table');
}

const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🔧 Setting up trivia_leads table in Supabase...\n');

async function createTable() {
  try {
    // Use RPC to execute SQL directly
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create trivia_leads table
        CREATE TABLE IF NOT EXISTS trivia_leads (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          interests TEXT[] DEFAULT '{}',
          score INTEGER NOT NULL,
          answers INTEGER[] DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_trivia_leads_created ON trivia_leads(created_at DESC);
        CREATE INDEX IF NOT EXISTS idx_trivia_leads_score ON trivia_leads(score DESC);

        -- Enable RLS
        ALTER TABLE trivia_leads ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies
        DROP POLICY IF EXISTS "Anyone can create trivia leads" ON trivia_leads;
        DROP POLICY IF EXISTS "Anyone can view trivia leads" ON trivia_leads;

        -- Create policies
        CREATE POLICY "Anyone can create trivia leads" ON trivia_leads FOR INSERT WITH CHECK (true);
        CREATE POLICY "Anyone can view trivia leads" ON trivia_leads FOR SELECT USING (true);
      `
    });

    if (error) {
      console.log('❌ Error creating table:', error);
      
      // Try alternative method using direct table creation
      console.log('🔄 Trying alternative method...');
      
      const createResult = await supabase.schema('public').createTable('trivia_leads', (table) => {
        table.uuid('id').primaryKey().defaultTo('gen_random_uuid()');
        table.text('name').notNull();
        table.text('email');
        table.text('phone');
        table.specificType('interests', 'TEXT[]').defaultTo('{}');
        table.integer('score').notNull();
        table.specificType('answers', 'INTEGER[]').defaultTo('{}');
        table.timestamptz('created_at').defaultTo('NOW()');
      });

      if (createResult.error) {
        console.log('❌ Alternative method failed:', createResult.error);
        console.log('\n📋 Manual Setup Required:');
        console.log('Go to: https://supabase.com/dashboard/project/govktyrtmwzbzqkmzmrf/sql/new');
        console.log('Copy and paste the SQL from setup-trivia-table.sql');
        return;
      }
    }

    console.log('✅ Table setup complete!');
    
    // Test the setup
    console.log('🧪 Testing the new table...');
    const { count, error: testError } = await supabase
      .from('trivia_leads')
      .select('*', { count: 'exact', head: true });

    if (testError) {
      console.log('❌ Test failed:', testError);
      return;
    }

    console.log('✅ Table is working! Current record count:', count || 0);
    console.log('\n🎉 Your trivia app is now ready for deployment!');
    
  } catch (err) {
    console.error('💥 Unexpected error:', err);
    console.log('\n📋 Manual Setup Required:');
    console.log('1. Go to: https://supabase.com/dashboard/project/govktyrtmwzbzqkmzmrf/sql/new');
    console.log('2. Copy and paste the SQL from setup-trivia-table.sql');
    console.log('3. Click Run');
  }
}

createTable();
