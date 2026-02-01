import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createBOL() {
  try {
    console.log('Creating BOL for Jack Mendoza - Dog Food...\n');

    // Generate BOL number
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');

    const { count, error: countError } = await supabase
      .from('ops_bols')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${today.toISOString().split('T')[0]}T00:00:00`)
      .lte('created_at', `${today.toISOString().split('T')[0]}T23:59:59`);

    if (countError) throw countError;

    const sequence = ((count || 0) + 1).toString().padStart(3, '0');
    const bolNumber = `BOL-${dateStr}-${sequence}`;

    console.log(`BOL Number: ${bolNumber}`);

    // Calculate weights
    const grossWeight = 72900;
    const tareWeight = 34129;
    const netWeight = grossWeight - tareWeight;
    const netWeightTons = (netWeight / 2000).toFixed(2);

    const bolData = {
      bol_number: bolNumber,
      date: '2026-01-27',
      origin_location: 'SSW BioSoils',
      origin_address: '18980 Stanton Rd',
      origin_city: 'Congress',
      origin_state: 'AZ',
      origin_zip: '85332',
      customer_name: 'Jack Mendoza',
      destination_address: '',
      destination_city: 'Bakersfield',
      destination_state: 'CA',
      destination_zip: '',
      material_type: 'Food Waste',
      material_description: 'Dog Food',
      gross_weight: grossWeight,
      tare_weight: tareWeight,
      net_weight: netWeight,
      net_weight_tons: netWeightTons,
      carrier_name: 'Total Way Trucking',
      driver_name: 'Emanuel',
      license_plate: '4UH3224',
      trailer_number: '53841',
      time_in: '11:00 AM',
      time_out: '12:30 PM',
      load_type: 'Drive-in',
      status: 'completed',
      created_by: 'ralvarez@soilseedandwater.com'
    };

    const { data, error } = await supabase
      .from('ops_bols')
      .insert(bolData)
      .select()
      .single();

    if (error) throw error;

    console.log('\n✅ BOL created successfully!');
    console.log(`\nBOL ID: ${data.id}`);
    console.log(`BOL Number: ${data.bol_number}`);
    console.log(`Customer: ${data.customer_name}`);
    console.log(`Net Weight: ${data.net_weight.toLocaleString()} lbs (${data.net_weight_tons} tons)`);
    console.log(`\nBOL ID for email: ${data.id}`);

    return data;

  } catch (err) {
    console.error('Error creating BOL:', err);
    throw err;
  }
}

createBOL();
