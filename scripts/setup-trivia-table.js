// Run this script to create the trivia_leads table
// node scripts/setup-trivia-table.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTriviaTable() {
  console.log('Creating trivia_leads table...');
  
  // First, try to create the table
  const { data: existingTable } = await supabase
    .from('trivia_leads')
    .select('id')
    .limit(1);
  
  if (!existingTable) {
    console.log('Table does not exist yet. Please run this SQL in Supabase Dashboard:');
    console.log(`
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

CREATE INDEX IF NOT EXISTS idx_trivia_leads_created ON trivia_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trivia_leads_score ON trivia_leads(score DESC);
    `);
  } else {
    console.log('Table already exists!');
  }
}

createTriviaTable().catch(console.error);