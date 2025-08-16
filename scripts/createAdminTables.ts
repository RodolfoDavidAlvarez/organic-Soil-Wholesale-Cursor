import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminTables() {
  console.log('🚀 Creating admin tables...');
  
  try {
    // Create admin_profiles table
    const { error: adminProfilesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS admin_profiles (
          id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT UNIQUE NOT NULL,
          role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'inventory_manager', 'order_processor')),
          permissions JSONB DEFAULT '{}',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
        );
      `
    });

    if (adminProfilesError) {
      console.log('Creating admin_profiles table manually...');
      
      // Try direct approach via SQL query
      const { error } = await supabase
        .from('admin_profiles')
        .select('id')
        .limit(1);
        
      if (error && error.message.includes('relation "admin_profiles" does not exist')) {
        console.error('❌ Admin tables need to be created manually in Supabase dashboard');
        console.log('\n📝 Run this SQL in your Supabase SQL Editor:');
        console.log(`
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'inventory_manager', 'order_processor')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable Row Level Security
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
CREATE TRIGGER update_admin_profiles_updated_at BEFORE UPDATE ON admin_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);
        return;
      }
    }

    console.log('✅ Admin tables created successfully!');
    
    // Now try to create admin profile
    console.log('🔍 Finding admin user...');
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error listing users:', usersError);
      return;
    }
    
    const adminUser = users.users.find(u => u.email === 'ralvarez@soilseedandwater.com');
    
    if (adminUser) {
      console.log('👤 Found admin user, creating profile...');
      
      const { error: profileError } = await supabase
        .from('admin_profiles')
        .upsert({
          id: adminUser.id,
          email: 'ralvarez@soilseedandwater.com',
          role: 'super_admin',
          permissions: { all: true }
        });
        
      if (profileError) {
        console.error('❌ Error creating admin profile:', profileError);
      } else {
        console.log('✅ Admin profile created successfully!');
      }
    } else {
      console.log('⚠️  Admin user not found. You may need to create it first.');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

createAdminTables();