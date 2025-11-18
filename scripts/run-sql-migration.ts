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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql: string): Promise<boolean> {
  try {
    // Remove single-line comments (-- comments)
    const lines = sql.split('\n');
    const cleanedLines = lines.map(line => {
      // Preserve lines that are part of multi-line strings, but remove standalone comments
      const trimmed = line.trim();
      if (trimmed.startsWith('--') && !trimmed.includes('::')) {
        return ''; // Remove comment-only lines
      }
      // Remove inline comments (but preserve -- in strings like '{}'::text[])
      const commentMatch = line.match(/^([^'"]*(?:'[^']*'|"[^"]*")?[^'"]*?)(--.*)$/);
      if (commentMatch && !commentMatch[1].includes('::')) {
        return commentMatch[1].trim();
      }
      return line;
    });

    const cleanedSQL = cleanedLines.join('\n');

    // Split by semicolons that are not inside strings
    const statements: string[] = [];
    let currentStatement = '';
    let inString = false;
    let stringChar = '';

    for (let i = 0; i < cleanedSQL.length; i++) {
      const char = cleanedSQL[i];
      const nextChar = cleanedSQL[i + 1];

      if (!inString && (char === "'" || char === '"')) {
        inString = true;
        stringChar = char;
        currentStatement += char;
      } else if (inString && char === stringChar && cleanedSQL[i - 1] !== '\\') {
        inString = false;
        currentStatement += char;
      } else if (!inString && char === ';') {
        const trimmed = currentStatement.trim();
        if (trimmed.length > 0) {
          statements.push(trimmed);
        }
        currentStatement = '';
      } else {
        currentStatement += char;
      }
    }

    // Add final statement if exists
    const finalTrimmed = currentStatement.trim();
    if (finalTrimmed.length > 0) {
      statements.push(finalTrimmed);
    }

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement.trim()) continue;

      const firstWords = statement.split(/\s+/).slice(0, 4).join(' ').substring(0, 60);
      process.stdout.write(`⚡ [${i + 1}/${statements.length}] ${firstWords}... `);

      try {
        // Use Supabase RPC to execute SQL
        // Note: This requires the exec_sql function to be created in Supabase
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement + ';' 
        });

        if (error) {
          // Try alternative parameter name
          const { error: altError } = await supabase.rpc('exec_sql', { 
            sql: statement + ';' 
          });

          if (altError) {
            console.log('❌');
            console.log(`   Error: ${error.message || altError.message}`);
            console.log('\n⚠️  Direct SQL execution not available.');
            console.log('   This SQL needs to be run manually in Supabase Dashboard.');
            return false;
          } else {
            console.log('✅');
          }
        } else {
          console.log('✅');
        }
      } catch (err: any) {
        console.log('❌');
        console.log(`   Error: ${err.message}`);
        return false;
      }
    }

    return true;
  } catch (error: any) {
    console.error('💥 Error executing SQL:', error.message);
    return false;
  }
}

async function runMigration(sqlFilePath: string) {
  console.log('🚀 Running SQL Migration\n');
  console.log(`📄 Reading SQL file: ${sqlFilePath}\n`);

  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ SQL file not found: ${sqlFilePath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(sqlFilePath, 'utf-8');
  console.log('✅ SQL file loaded\n');

  // Test connection
  console.log('🔍 Testing database connection...');
  const { error: testError } = await supabase.from('representatives').select('id').limit(1);
  
  if (testError && !testError.message.includes('0 rows')) {
    console.error('❌ Database connection failed:', testError.message);
    console.log('\n📝 Please run this SQL manually in Supabase Dashboard:');
    console.log('   1. Go to https://supabase.com/dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste the contents of the SQL file');
    console.log('   4. Execute the query\n');
    return;
  }

  console.log('✅ Database connection successful\n');

  const success = await executeSQL(sql);

  if (success) {
    console.log('\n✅ Migration completed successfully!\n');
    
    // Verify the changes
    console.log('🔍 Verifying changes...');
    const { data, error: verifyError } = await supabase
      .from('representatives')
      .select('banner_image_url, gallery_images, contact_button_text, contact_card_button_text, contact_form_title, contact_form_description')
      .limit(1);

    if (verifyError) {
      console.log('⚠️  Could not verify (this is okay if table is empty)');
    } else {
      console.log('✅ Columns verified - migration successful!');
    }
  } else {
    console.log('\n⚠️  Migration failed or requires manual execution.');
    console.log('\n📝 To run manually:');
    console.log('   1. Go to Supabase Dashboard → SQL Editor');
    console.log('   2. Copy contents of:', sqlFilePath);
    console.log('   3. Paste and execute\n');
  }
}

// Get SQL file path from command line or use default
const sqlFile = process.argv[2] || path.join(__dirname, 'add-representative-contact-fields.sql');

runMigration(sqlFile).catch(console.error);

