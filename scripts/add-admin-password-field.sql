-- Add password_hash and full_name fields to admin_users table
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Update the existing admin user with a temporary password
-- Note: This password should be changed immediately after first login
-- Password: "changeme123" (bcrypt hash)
UPDATE admin_users 
SET password_hash = '$2b$10$YourHashHere' -- You'll need to generate this
WHERE email = 'ralvarez@soilseedandwater.com';

-- Ensure password_hash is required for future inserts
ALTER TABLE admin_users 
ALTER COLUMN password_hash SET NOT NULL;