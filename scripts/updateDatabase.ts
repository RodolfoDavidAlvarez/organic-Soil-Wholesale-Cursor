import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: "./server/.env" });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateDatabase() {
  console.log("🚀 Starting database update...");

  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, "complete-admin-setup.sql");
    const sqlContent = fs.readFileSync(sqlPath, "utf-8");

    // Split the SQL into individual statements
    const statements = sqlContent
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

        const { data, error } = await supabase.rpc("exec_sql", { sql: statement });

        if (error) {
          console.warn(`⚠️  Statement ${i + 1} warning:`, error.message);
          // Continue with other statements
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }

    console.log("\n🎉 Database update completed!");
  } catch (error) {
    console.error("💥 Error updating database:", error);
  }
}

// Alternative approach: Execute statements directly
async function updateDatabaseDirect() {
  console.log("🚀 Starting direct database update...");

  try {
    // Execute the key statements manually
    const statements = [
      // Add Pay & Pickup columns to products
      `ALTER TABLE products 
       ADD COLUMN IF NOT EXISTS product_status TEXT DEFAULT 'active',
       ADD COLUMN IF NOT EXISTS is_pay_and_pickup_enabled BOOLEAN DEFAULT false,
       ADD COLUMN IF NOT EXISTS pay_and_pickup_display_order INTEGER DEFAULT 0,
       ADD COLUMN IF NOT EXISTS pay_and_pickup_badge TEXT,
       ADD COLUMN IF NOT EXISTS pay_and_pickup_description TEXT,
       ADD COLUMN IF NOT EXISTS pay_and_pickup_hero_image TEXT`,

      // Add other missing columns
      `ALTER TABLE products 
       ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 10`,

      `ALTER TABLE orders
       ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255),
       ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
       ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`,

      // Create order_items table
      `CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )`,

      // Create inventory_alerts table
      `CREATE TABLE IF NOT EXISTS inventory_alerts (
        id SERIAL PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        alert_type TEXT NOT NULL,
        threshold INTEGER,
        current_level INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        resolved_at TIMESTAMP
      )`,

      // Create order_status_history table
      `CREATE TABLE IF NOT EXISTS order_status_history (
        id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(id),
        status TEXT NOT NULL,
        changed_by INTEGER REFERENCES admin_users(id),
        changed_at TIMESTAMP DEFAULT NOW(),
        notes TEXT
      )`,
    ];

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

      const { data, error } = await supabase.rpc("exec_sql", { sql: statement });

      if (error) {
        console.warn(`⚠️  Statement ${i + 1} warning:`, error.message);
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    }

    // Insert admin user
    console.log("👤 Creating admin user...");
    const { data: adminData, error: adminError } = await supabase.from("admin_users").upsert(
      {
        email: "ralvarez@soilseedandwater.com",
        password_hash: "$2b$10$TkNeJMvq/pCSNzRiRIHO1.VeczIS2N0dDhlznjFqi7f6L03ooL07S",
        full_name: "Rodolfo Alvarez",
        role: "super_admin",
        permissions: { all: true },
      },
      {
        onConflict: "email",
      }
    );

    if (adminError) {
      console.warn("⚠️  Admin user creation warning:", adminError.message);
    } else {
      console.log("✅ Admin user created/updated successfully");
    }

    console.log("\n🎉 Database update completed!");
  } catch (error) {
    console.error("💥 Error updating database:", error);
  }
}

// Try the direct approach first
updateDatabaseDirect();
