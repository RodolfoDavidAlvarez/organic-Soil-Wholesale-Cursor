import { Client } from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Get database connection string
// Try DATABASE_URL first, then construct from Supabase URL if needed
let connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  // Construct connection string from Supabase URL if DATABASE_URL not available
  const supabaseUrl = process.env.SUPABASE_URL;
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || process.env.DATABASE_PASSWORD;

  if (supabaseUrl && dbPassword) {
    // Extract project reference from Supabase URL
    // Example: https://govktyrtmwzbzqkmzmrf.supabase.co
    const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/);
    if (match) {
      const projectRef = match[1];
      connectionString = `postgresql://postgres.${projectRef}:${dbPassword}@aws-0-us-west-1.pooler.supabase.com:5432/postgres`;
    }
  }
}

if (!connectionString) {
  console.error("❌ Missing DATABASE_URL or Supabase database credentials");
  console.log("\n💡 You need either:");
  console.log("   1. DATABASE_URL environment variable, or");
  console.log("   2. SUPABASE_URL and SUPABASE_DB_PASSWORD (or DATABASE_PASSWORD)");
  console.log("\n   To get your Supabase connection string:");
  console.log("   1. Go to Supabase Dashboard > Settings > Database");
  console.log('   2. Copy the "Connection string" (URI format)');
  console.log("   3. Add it as DATABASE_URL in your .env file");
  process.exit(1);
}

async function runUpdate() {
  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log("🚀 Running customer_portal_products table update...\n");
    console.log("=".repeat(60));

    // Connect to database
    console.log("🔍 Connecting to database...");
    await client.connect();
    console.log("✅ Connected successfully\n");

    // Verify table exists
    console.log("🔍 Verifying customer_portal_products table exists...");
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'customer_portal_products'
      );
    `);

    if (!tableCheck.rows[0].exists) {
      console.error("❌ Table customer_portal_products does not exist!");
      console.log("\n💡 You need to create the table first.");
      console.log("   Run: scripts/create-customer-portal-products-table.sql");
      process.exit(1);
    }
    console.log("✅ Table exists\n");

    // Read the SQL file
    const sqlPath = path.join(__dirname, "update-customer-portal-products.sql");
    console.log(`📄 Reading SQL file: ${sqlPath}`);

    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ SQL file not found: ${sqlPath}`);
      process.exit(1);
    }

    const sqlContent = fs.readFileSync(sqlPath, "utf-8");
    console.log("✅ SQL file read successfully\n");

    // Split SQL into individual statements
    const statements = sqlContent
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement.trim()) continue;

      const firstLine = statement.split("\n")[0].substring(0, 60);
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
      console.log(`   ${firstLine}...`);

      try {
        await client.query(statement + ";");
        console.log(`   ✅ Success\n`);
        successCount++;
      } catch (err: any) {
        // Ignore "already exists" errors for IF NOT EXISTS clauses
        if (err.message.includes("already exists") || err.message.includes("duplicate")) {
          console.log(`   ⚠️  Warning: ${err.message.split("\n")[0]}\n`);
          successCount++; // Count as success since column already exists
        } else {
          console.log(`   ❌ Error: ${err.message.split("\n")[0]}\n`);
          errorCount++;
        }
      }
    }

    // Verify the new columns exist
    console.log("🔍 Verifying new columns...");
    const columnCheck = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'customer_portal_products'
      AND column_name IN (
        'category',
        'marketing_title',
        'marketing_note',
        'seo_keywords',
        'pay_and_pickup_hero_image',
        'pay_and_pickup_badge',
        'catalog_display_order',
        'is_catalog_enabled'
      )
      ORDER BY column_name;
    `);

    console.log(`✅ Found ${columnCheck.rows.length} new columns:`);
    columnCheck.rows.forEach((row) => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });

    console.log("\n" + "=".repeat(60));
    console.log("\n📊 Execution Summary:");
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);

    if (errorCount === 0) {
      console.log("\n🎉 All statements executed successfully!");
      console.log("\n✅ The customer_portal_products table has been updated with:");
      console.log("   - category");
      console.log("   - marketing_title");
      console.log("   - marketing_note");
      console.log("   - seo_keywords");
      console.log("   - pay_and_pickup_hero_image");
      console.log("   - pay_and_pickup_badge");
      console.log("   - catalog_display_order");
      console.log("   - is_catalog_enabled");
    } else {
      console.log("\n⚠️  Some statements failed. Check the errors above.");
    }
  } catch (error: any) {
    console.error("\n💥 Unexpected error:", error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the update
runUpdate();
