import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  console.log('\n💡 Make sure you have a .env file in the server/ directory with:');
  console.log('   SUPABASE_URL=your_supabase_url');
  console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🚀 Running representative contact fields migration...\n');

  try {
    // Test connection first
    console.log('🔍 Testing database connection...');
    const { data, error: testError } = await supabase.from('representatives').select('id').limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError.message);
      console.log('\n📝 Please run this SQL manually in Supabase Dashboard:');
      console.log('   1. Go to https://supabase.com/dashboard');
      console.log('   2. Navigate to SQL Editor');
      console.log('   3. Copy and paste the contents of: scripts/add-representative-contact-fields.sql');
      console.log('   4. Execute the query\n');
      return;
    }

    console.log('✅ Database connection successful\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'add-representative-contact-fields.sql');
    console.log(`📄 Reading SQL file: ${sqlPath}`);
    
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ SQL file not found: ${sqlPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8');
    console.log('✅ SQL file loaded\n');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement.trim()) continue;

      try {
        const firstWords = statement.split(/\s+/).slice(0, 3).join(' ').substring(0, 50);
        process.stdout.write(`⚡ [${i + 1}/${statements.length}] ${firstWords}... `);

        // Try using RPC if available
        const { error: rpcError } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });

        if (rpcError) {
          // Try alternative RPC format
          const { error: altError } = await supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          });

          if (altError) {
            console.log('❌');
            console.log(`   Error: ${rpcError.message || altError.message}`);
            errorCount++;
            console.log('\n⚠️  Automatic execution failed. Please run this SQL manually:');
            console.log('   1. Go to Supabase Dashboard → SQL Editor');
            console.log('   2. Copy and paste the SQL file contents');
            console.log('   3. Execute the query\n');
            return;
          } else {
            console.log('✅');
            successCount++;
          }
        } else {
          console.log('✅');
          successCount++;
        }
      } catch (err: any) {
        console.log('❌');
        console.log(`   Error: ${err.message}`);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary: ${successCount} succeeded, ${errorCount} failed\n`);

    if (errorCount > 0) {
      console.log('⚠️  Some statements failed. This might be normal if:');
      console.log('   - Columns already exist (IF NOT EXISTS should handle this)');
      console.log('   - RPC function is not available\n');
      console.log('📝 To run manually:');
      console.log('   1. Go to Supabase Dashboard → SQL Editor');
      console.log('   2. Copy contents of: scripts/add-representative-contact-fields.sql');
      console.log('   3. Paste and execute\n');
    } else {
      console.log('✅ Migration completed successfully!\n');
      
      // Verify the changes
      console.log('🔍 Verifying changes...');
      const { data: columns, error: verifyError } = await supabase
        .from('representatives')
        .select('banner_image_url, gallery_images, contact_button_text, contact_card_button_text, contact_form_title, contact_form_description')
        .limit(1);

      if (verifyError) {
        console.log('⚠️  Could not verify (this is okay if table is empty)');
      } else {
        console.log('✅ Columns verified - migration successful!');
      }
    }

  } catch (error: any) {
    console.error('💥 Unexpected error:', error.message);
    console.log('\n📝 Please run this SQL manually in Supabase Dashboard SQL Editor');
  }
}

// Run the migration
runMigration().catch(console.error);


