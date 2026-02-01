import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function listRecentBOLs() {
  try {
    console.log('Listing recent BOLs...\n');

    const { data, error } = await supabase
      .from('ops_bols')
      .select('id, bol_number, customer_name, date, destination_address, destination_city, destination_state')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No BOLs found');
      return;
    }

    console.log(`Found ${data.length} recent BOLs:\n`);
    console.log('ID | BOL Number | Customer | Date | Address');
    console.log('---'.repeat(30));

    data.forEach((bol) => {
      const date = new Date(bol.date).toLocaleDateString();
      console.log(`${bol.id} | ${bol.bol_number} | ${bol.customer_name} | ${date} | ${bol.destination_address}, ${bol.destination_city || ''}, ${bol.destination_state || ''}`);
    });

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

listRecentBOLs();
