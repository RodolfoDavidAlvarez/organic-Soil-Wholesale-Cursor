import bcrypt from 'bcrypt';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixAdminLogin() {
  try {
    // 1. Generate a new password hash
    const password = 'admin123';
    const newHash = await bcrypt.hash(password, 10);
    
    console.log('Generated new password hash for admin123');
    
    // 2. Update ALL admin users with this password
    const { data, error } = await supabase
      .from('admin_users')
      .update({ 
        password_hash: newHash,
        full_name: 'Admin User'
      })
      .in('email', ['ralvarez@soilseedandwater.com', 'admin@organicsoilwholesale.com']);
    
    if (error) {
      console.error('Error updating admin users:', error);
      return;
    }
    
    console.log('✅ Admin password updated successfully!');
    
    // 3. Verify the update worked
    const { data: admins } = await supabase
      .from('admin_users')
      .select('email, full_name')
      .in('email', ['ralvarez@soilseedandwater.com', 'admin@organicsoilwholesale.com']);
    
    console.log('\n📧 Admin users ready to login:');
    admins?.forEach(admin => {
      console.log(`- Email: ${admin.email}`);
      console.log(`  Password: admin123`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixAdminLogin();