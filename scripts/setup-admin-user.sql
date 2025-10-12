-- First, ensure the admin_users table has the required columns
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Insert or update the admin user with the generated password hash
INSERT INTO admin_users (email, password_hash, full_name, role, permissions)
VALUES (
  'admin@organicsoilwholesale.com', 
  '$2b$10$TkNeJMvq/pCSNzRiRIHO1.VeczIS2N0dDhlznjFqi7f6L03ooL07S', 
  'Admin User', 
  'super_admin', 
  '{"all": true}'::jsonb
)
ON CONFLICT (email) DO UPDATE
SET 
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions;

-- Also update the existing admin if present
UPDATE admin_users 
SET 
  password_hash = '$2b$10$TkNeJMvq/pCSNzRiRIHO1.VeczIS2N0dDhlznjFqi7f6L03ooL07S',
  full_name = 'Admin User'
WHERE email = 'ralvarez@soilseedandwater.com';