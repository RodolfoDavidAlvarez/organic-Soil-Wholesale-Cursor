import { supabase } from '../db/supabase.js';

async function createTriviaLeadsTable() {
  try {
    // Execute SQL to create table
    const { error } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.trivia_leads (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          interests TEXT[] NOT NULL,
          score INTEGER NOT NULL CHECK (score >= 0 AND score <= 5),
          answers INTEGER[] NOT NULL,
          event_name TEXT DEFAULT 'Trade Show 2025',
          prize_code TEXT DEFAULT 'SOIL20',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_trivia_leads_email ON public.trivia_leads(email);
        CREATE INDEX IF NOT EXISTS idx_trivia_leads_created_at ON public.trivia_leads(created_at DESC);
      `
    }).single();

    if (error) {
      console.error('Error creating table:', error);
      return;
    }

    console.log('✅ Trivia leads table created successfully!');
  } catch (err) {
    console.error('Failed:', err);
  }
}

createTriviaLeadsTable();