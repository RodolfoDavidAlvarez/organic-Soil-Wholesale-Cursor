import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// The Management API allows SQL execution
// First let's try the direct postgres connection with proper config
import pg from 'pg';
const { Pool } = pg;

async function runMigration() {
  // Try direct connection to Supabase database
  const connectionString = process.env.DATABASE_URL;

  console.log('Attempting database connection...');

  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    const result = await pool.query('ALTER TABLE representative_contacts ALTER COLUMN representative_id DROP NOT NULL;');
    console.log('Migration successful!', result);
  } catch (error) {
    console.error('Migration error:', error.message);

    // If connection fails, print the SQL for manual execution
    console.log('\n--- Manual SQL (run in Supabase SQL Editor) ---');
    console.log('ALTER TABLE representative_contacts ALTER COLUMN representative_id DROP NOT NULL;');
    console.log('--- End SQL ---\n');
  } finally {
    await pool.end();
  }
}

runMigration();
