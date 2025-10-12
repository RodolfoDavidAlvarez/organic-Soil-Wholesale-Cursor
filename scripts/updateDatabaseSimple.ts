import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: "./server/.env" });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateDatabase() {
  console.log("🚀 Starting database update...");

  try {
    // First, let's check if the columns already exist by trying to query them
    console.log("🔍 Checking existing schema...");

    const { data: existingProducts, error: checkError } = await supabase.from("products").select("is_pay_and_pickup_enabled").limit(1);

    if (checkError && checkError.code === "PGRST204") {
      console.log("📝 Adding Pay & Pickup columns to products table...");

      // The columns don't exist, so we need to add them
      // Since we can't execute raw SQL directly, we'll work around this
      console.log("⚠️  Cannot add columns directly via Supabase client.");
      console.log("💡 You need to run the SQL script manually in the Supabase Dashboard:");
      console.log("");
      console.log("1. Go to: https://supabase.com/dashboard/project/govktyrtmwzbzqkmzmrf/sql");
      console.log("2. Run this SQL:");
      console.log("");
      console.log(`ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_pay_and_pickup_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pay_and_pickup_display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS pay_and_pickup_badge TEXT,
ADD COLUMN IF NOT EXISTS pay_and_pickup_description TEXT,
ADD COLUMN IF NOT EXISTS pay_and_pickup_hero_image TEXT,
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 10;`);
      console.log("");
      console.log("3. Then run this script again to seed the data.");

      return;
    } else if (checkError) {
      console.error("❌ Error checking schema:", checkError);
      return;
    } else {
      console.log("✅ Pay & Pickup columns already exist!");
    }

    // Check if admin user exists
    console.log("👤 Checking admin user...");
    const { data: adminUser, error: adminCheckError } = await supabase
      .from("admin_users")
      .select("*")
      .eq("email", "ralvarez@soilseedandwater.com")
      .single();

    if (adminCheckError && adminCheckError.code === "PGRST116") {
      console.log("👤 Creating admin user...");
      const { data: newAdmin, error: createAdminError } = await supabase
        .from("admin_users")
        .insert({
          email: "ralvarez@soilseedandwater.com",
          password_hash: "$2b$10$TkNeJMvq/pCSNzRiRIHO1.VeczIS2N0dDhlznjFqi7f6L03ooL07S",
          full_name: "Rodolfo Alvarez",
          role: "super_admin",
          permissions: { all: true },
        })
        .select()
        .single();

      if (createAdminError) {
        console.error("❌ Error creating admin user:", createAdminError);
      } else {
        console.log("✅ Admin user created successfully!");
      }
    } else if (adminCheckError) {
      console.error("❌ Error checking admin user:", adminCheckError);
    } else {
      console.log("✅ Admin user already exists!");
    }

    console.log("\n🎉 Database check completed!");
  } catch (error) {
    console.error("💥 Error updating database:", error);
  }
}

updateDatabase();
