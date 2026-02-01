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

async function findPawsFuelBOLs() {
  try {
    console.log('Searching for Paws Fuel BOLs...\n');

    const { data, error } = await supabase
      .from('ops_bols')
      .select('*')
      .ilike('customer_name', '%paws%')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('No BOLs found for Paws Fuel');
      return;
    }

    console.log(`Found ${data.length} BOL(s) for Paws Fuel:\n`);

    data.forEach((bol, index) => {
      console.log(`\n--- BOL #${index + 1} ---`);
      console.log(`BOL Number: ${bol.bol_number}`);
      console.log(`Date: ${new Date(bol.date).toLocaleDateString()}`);
      console.log(`Customer: ${bol.customer_name}`);
      console.log(`Address: ${bol.destination_address}`);
      console.log(`City: ${bol.destination_city}`);
      console.log(`State: ${bol.destination_state}`);
      console.log(`ZIP: ${bol.destination_zip}`);
      console.log(`Contact: ${bol.onsite_contact_name || 'N/A'}`);
      console.log(`Phone: ${bol.onsite_contact_phone || 'N/A'}`);
      console.log(`Material: ${bol.material_type}`);
      console.log(`Description: ${bol.material_description || 'N/A'}`);
      console.log(`Net Weight: ${bol.net_weight} lbs (${bol.net_weight_tons} tons)`);
    });

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

findPawsFuelBOLs();
