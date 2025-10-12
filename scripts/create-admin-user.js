import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function createAdminUser() {
  const email = 'admin@organicsoilwholesale.com';
  const password = 'admin123'; // Change this immediately after first login
  const fullName = 'Admin User';

  try {
    // Generate password hash
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('Admin user credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Password hash:', passwordHash);
    console.log('\nUse this hash in your database migration or direct insert.');
    console.log('\nSQL command:');
    console.log(`
UPDATE admin_users 
SET password_hash = '${passwordHash}',
    full_name = '${fullName}'
WHERE email = 'ralvarez@soilseedandwater.com';

-- Or insert a new admin:
INSERT INTO admin_users (email, password_hash, full_name, role, permissions)
VALUES ('${email}', '${passwordHash}', '${fullName}', 'super_admin', '{"all": true}'::jsonb)
ON CONFLICT (email) DO UPDATE
SET password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name;
    `);
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser();