-- Setup Super Admin User
-- This script sets up the authentication for the super admin user
-- Run this in your Supabase SQL Editor

-- Step 1: Ensure admin_users table exists with all required columns
-- (This should already exist, but we'll make sure it has password_hash and full_name)
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS password_hash TEXT,
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);

-- Step 2: Ensure UUID default is set (if id is UUID type)
DO $$
DECLARE
    id_type TEXT;
BEGIN
    -- Check the data type of the id column
    SELECT data_type INTO id_type
    FROM information_schema.columns
    WHERE table_name = 'admin_users' AND column_name = 'id';
    
    -- If it's UUID and doesn't have a default, set one
    IF id_type = 'uuid' THEN
        -- Check if default exists
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'admin_users' 
            AND column_name = 'id' 
            AND column_default IS NOT NULL
        ) THEN
            ALTER TABLE admin_users ALTER COLUMN id SET DEFAULT gen_random_uuid();
        END IF;
    END IF;
END $$;

-- Step 3: Check if user exists, then insert or update
DO $$
DECLARE
    user_exists BOOLEAN;
BEGIN
    -- Check if user already exists
    SELECT EXISTS(SELECT 1 FROM admin_users WHERE email = 'ralvarez@soilseedandwater.com') INTO user_exists;
    
    IF user_exists THEN
        -- Update existing user
        UPDATE admin_users 
        SET 
            password_hash = '$2b$10$rJnjJ3emeA3yCn6YrrFlfOFw1fC.LcxcO1.xNHCBGIX5fUm1iqklu',
            full_name = 'Rodolfo Alvarez',
            role = 'super_admin',
            permissions = '{"all": true}'::jsonb,
            is_active = true
        WHERE email = 'ralvarez@soilseedandwater.com';
    ELSE
        -- Insert new user (id will auto-generate as UUID if default is set)
        -- If no default, we'll generate a UUID
        INSERT INTO admin_users (id, email, password_hash, full_name, role, permissions, is_active)
        VALUES (
            gen_random_uuid(),
            'ralvarez@soilseedandwater.com',
            '$2b$10$rJnjJ3emeA3yCn6YrrFlfOFw1fC.LcxcO1.xNHCBGIX5fUm1iqklu',
            'Rodolfo Alvarez',
            'super_admin',
            '{"all": true}'::jsonb,
            true
        );
    END IF;
END $$;

-- Step 3: Verify the user was created/updated successfully
SELECT 
  id, 
  email, 
  full_name, 
  role, 
  is_active, 
  created_at,
  CASE 
    WHEN password_hash IS NOT NULL THEN 'Password set' 
    ELSE 'No password' 
  END as password_status
FROM admin_users 
WHERE email = 'ralvarez@soilseedandwater.com';

