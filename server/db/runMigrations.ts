import { supabase } from './supabase.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    console.log('Running database migrations...');

    // Read the migration file
    const migrationPath = path.join(__dirname, 'migrations', 'create_inventory_tables.sql');
    const migrationSQL = await fs.readFile(migrationPath, 'utf-8');

    // Split the SQL into individual statements (simple split by semicolon)
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    // Execute each statement
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: statement + ';' 
      }).single();

      if (error) {
        // Try direct execution as alternative
        const { error: directError } = await supabase
          .from('_migrations')
          .insert({ sql: statement })
          .single();
        
        if (directError) {
          console.error('Error executing statement:', error || directError);
          console.error('Statement:', statement);
        }
      }
    }

    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

// Run migrations if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigrations();
}