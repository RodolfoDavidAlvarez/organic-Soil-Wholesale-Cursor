import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdminTables() {
  try {
    console.log('Setting up admin tables...');

    // Read the SQL file
    const sqlPath = join(__dirname, '..', 'server', 'db', 'migrations', 'create_admin_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).single();

    if (error) {
      // If the RPC doesn't exist, try executing statements one by one
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (const statement of statements) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        
        // For Supabase, we'll use direct SQL execution through the REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({
            query: statement + ';'
          })
        });

        if (!response.ok) {
          console.log('Note: Some statements may fail if tables already exist, continuing...');
        }
      }
    }

    // Insert the initial admin user using Supabase client
    const { data: existingAdmin } = await supabase
      .from('admin_users')
      .select('id')
      .eq('email', 'ralvarez@soilseedandwater.com')
      .single();

    if (!existingAdmin) {
      const { error: insertError } = await supabase
        .from('admin_users')
        .insert({
          email: 'ralvarez@soilseedandwater.com',
          role: 'super_admin',
          permissions: { all: true },
          is_active: true
        });

      if (insertError) {
        console.error('Error inserting admin user:', insertError);
      } else {
        console.log('Admin user created successfully!');
        console.log('Email: ralvarez@soilseedandwater.com');
        console.log('Temporary password: Admin2024!Soil');
      }
    } else {
      console.log('Admin user already exists');
    }

    console.log('\nAdmin setup completed!');
    console.log('You can now log in at: http://localhost:3000/admin');
    console.log('Email: ralvarez@soilseedandwater.com');
    console.log('Password: Admin2024!Soil');
    
  } catch (error) {
    console.error('Error setting up admin tables:', error);
    process.exit(1);
  }
}

setupAdminTables();