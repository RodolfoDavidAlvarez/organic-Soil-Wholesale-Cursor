import bcrypt from "bcrypt";

const password = "admin123";
const email = "ralvarez@soilseedandwater.com";

async function generateHash() {
  try {
    const hash = await bcrypt.hash(password, 10);
    console.log("\n=== Admin Password Hash Generated ===\n");
    console.log("Email:", email);
    console.log("Password:", password);
    console.log("Hash:", hash);
    console.log("\n=== SQL Statement ===\n");
    console.log(`-- Ensure admin_users table has required columns
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Insert or update super admin user
INSERT INTO admin_users (email, password_hash, full_name, role, permissions, is_active)
VALUES (
  '${email}',
  '${hash}',
  'Rodolfo Alvarez',
  'super_admin',
  '{"all": true}'::jsonb,
  true
)
ON CONFLICT (email) 
DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = EXCLUDED.is_active;

-- Verify the user was created/updated
SELECT id, email, full_name, role, is_active, created_at 
FROM admin_users 
WHERE email = '${email}';
`);
    console.log("\n=== End SQL ===\n");
  } catch (error) {
    console.error("Error generating hash:", error);
    process.exit(1);
  }
}

generateHash();


