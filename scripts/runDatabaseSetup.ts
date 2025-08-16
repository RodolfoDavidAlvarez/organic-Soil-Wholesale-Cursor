import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: '../server/.env' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up database schema...');

  try {
    // Test connection first
    console.log('🔍 Testing database connection...');
    const { data, error } = await supabase.from('locations').select('count').limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error);
      return;
    }

    console.log('✅ Database connection successful');

    // Read and execute the main schema
    console.log('📋 Reading main schema file...');
    const schemaPath = path.join(__dirname, 'create-supabase-tables.sql');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split SQL into individual statements
    const statements = schemaSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.warn(`⚠️  Warning on statement ${i + 1}:`, error.message);
          }
        } catch (err) {
          console.warn(`⚠️  Warning on statement ${i + 1}:`, err);
        }
      }
    }

    // Read and execute drive-through enhancements
    console.log('🚗 Reading drive-through enhancements...');
    const enhancementsPath = path.join(__dirname, 'drive-through-enhancements.sql');
    const enhancementsSQL = fs.readFileSync(enhancementsPath, 'utf-8');
    
    const enhancementStatements = enhancementsSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${enhancementStatements.length} enhancement statements to execute`);

    for (let i = 0; i < enhancementStatements.length; i++) {
      const statement = enhancementStatements[i];
      if (statement.trim()) {
        try {
          console.log(`⚡ Executing enhancement ${i + 1}/${enhancementStatements.length}...`);
          const { error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.warn(`⚠️  Warning on enhancement ${i + 1}:`, error.message);
          }
        } catch (err) {
          console.warn(`⚠️  Warning on enhancement ${i + 1}:`, err);
        }
      }
    }

    console.log('✅ Database schema setup completed!');

    // Verify key tables exist
    console.log('🔍 Verifying table creation...');
    const tables = ['products', 'inventory', 'orders', 'locations', 'drive_through_queue'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.error(`❌ Table ${table} not accessible:`, error.message);
        } else {
          console.log(`✅ Table ${table} verified`);
        }
      } catch (err) {
        console.error(`❌ Table ${table} verification failed:`, err);
      }
    }

  } catch (error) {
    console.error('💥 Unexpected error during database setup:', error);
  }
}

// Run the setup
setupDatabase();