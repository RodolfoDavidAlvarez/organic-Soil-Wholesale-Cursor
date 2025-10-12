-- Fix admin_users table UUID generation
-- Run this in your Supabase SQL editor

-- First, let's fix the admin_users table to properly generate UUIDs
ALTER TABLE admin_users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Now insert the admin user (UUID will be auto-generated)
INSERT INTO admin_users (email, password_hash, full_name, role, permissions)
VALUES (
  'ralvarez@soilseedandwater.com', 
  '$2b$10$TkNeJMvq/pCSNzRiRIHO1.VeczIS2N0dDhlznjFqi7f6L03ooL07S', 
  'Rodolfo Alvarez', 
  'super_admin', 
  '{"all": true}'::jsonb
)
ON CONFLICT (email) DO UPDATE
SET 
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions;

-- Verify the admin user was created
SELECT 'Admin user created successfully!' as message;
SELECT id, email, full_name, role FROM admin_users WHERE email = 'ralvarez@soilseedandwater.com';
