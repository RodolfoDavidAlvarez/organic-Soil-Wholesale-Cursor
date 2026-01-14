import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixConstraint() {
  console.log('Making representative_id nullable...');

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: 'ALTER TABLE representative_contacts ALTER COLUMN representative_id DROP NOT NULL;'
  });

  if (error) {
    console.log('RPC not available, trying direct query...');
    // Try using the REST API to run raw SQL
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
      },
      body: JSON.stringify({ sql: 'ALTER TABLE representative_contacts ALTER COLUMN representative_id DROP NOT NULL;' })
    });

    if (!response.ok) {
      console.log('Direct SQL execution not available. Please run this SQL in Supabase SQL Editor:');
      console.log('');
      console.log('ALTER TABLE representative_contacts ALTER COLUMN representative_id DROP NOT NULL;');
      console.log('');
      return;
    }
  }

  console.log('Done!');
}

fixConstraint();
