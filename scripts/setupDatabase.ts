import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQLFile(filePath: string, description: string) {
  console.log(`\n📄 Executing ${description}...`);
  
  try {
    // Read the SQL file
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split by semicolons but keep them with the statements
    const statements = sql
      .split(/;(?=\s*$)/m)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip empty statements or comments
      if (!statement.trim() || statement.trim().startsWith('--')) {
        continue;
      }
      
      try {
        // Extract the first few words to identify the operation
        const firstLine = statement.split('\n')[0].substring(0, 80);
        process.stdout.write(`  Statement ${i + 1}/${statements.length}: ${firstLine}...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement
        });
        
        if (error) {
          // Try direct execution for some operations
          const { error: directError } = await supabase.from('_sql').select(statement);
          
          if (directError) {
            console.log(' ❌');
            console.log(`    Error: ${error.message || directError.message}`);
            errorCount++;
          } else {
            console.log(' ✅');
            successCount++;
          }
        } else {
          console.log(' ✅');
          successCount++;
        }
      } catch (err: any) {
        console.log(' ❌');
        console.log(`    Error: ${err.message}`);
        errorCount++;
      }
    }
    
    console.log(`\n  Summary: ${successCount} succeeded, ${errorCount} failed`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. This might be normal if tables/functions already exist.');
      console.log('   You may need to run these SQL files directly in the Supabase Dashboard SQL editor.');
    }
    
    return errorCount === 0;
    
  } catch (error: any) {
    console.error(`❌ Failed to read/execute SQL file: ${error.message}`);
    return false;
  }
}

async function setupDatabase() {
  console.log('🚀 Starting database setup for Organic Soil Wholesale...');
  console.log('================================================\n');
  
  console.log('⚠️  IMPORTANT: This script will attempt to run SQL through Supabase.');
  console.log('   If it fails, you\'ll need to run the SQL files manually in Supabase Dashboard.\n');
  
  // Note about manual execution
  console.log('📝 To run manually:');
  console.log('   1. Go to your Supabase Dashboard');
  console.log('   2. Navigate to SQL Editor');
  console.log('   3. Copy and paste the contents of each SQL file');
  console.log('   4. Execute them in order\n');
  
  const sqlFiles = [
    {
      path: path.join(__dirname, 'create-supabase-tables.sql'),
      description: 'Main database schema'
    },
    {
      path: path.join(__dirname, 'drive-through-enhancements.sql'),
      description: 'Drive-through system enhancements'
    }
  ];
  
  let allSuccess = true;
  
  for (const sqlFile of sqlFiles) {
    const success = await executeSQLFile(sqlFile.path, sqlFile.description);
    if (!success) {
      allSuccess = false;
    }
  }
  
  console.log('\n================================================');
  
  if (allSuccess) {
    console.log('✅ Database setup completed successfully!');
    console.log('\n🎯 Next steps:');
    console.log('   1. Run: npx tsx scripts/seedCompleteProductDatabase.ts');
    console.log('   2. Run: npx tsx scripts/updatePricingFromHTML.ts');
    console.log('   3. Run: npx tsx scripts/testDatabaseConnection.ts (to verify)');
  } else {
    console.log('⚠️  Database setup completed with some errors.');
    console.log('\n🔧 Recommended actions:');
    console.log('   1. Run the SQL files manually in Supabase Dashboard');
    console.log('   2. Check if tables were created despite errors');
    console.log('   3. Continue with seeding if tables exist');
    
    console.log('\n📋 SQL files to run manually:');
    sqlFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.path}`);
    });
  }
}

// Run the setup
setupDatabase().catch(console.error);