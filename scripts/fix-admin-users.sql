-- Fix admin_users table structure and insert admin user
-- Run this in your Supabase SQL editor

-- First, let's check and fix the admin_users table structure
DO $$
BEGIN
    -- Check if id column exists and is serial
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'admin_users' 
        AND column_name = 'id' 
        AND column_default LIKE 'nextval%'
    ) THEN
        -- Make id column auto-incrementing
        ALTER TABLE admin_users ALTER COLUMN id SET DEFAULT nextval('admin_users_id_seq'::regclass);
        
        -- If sequence doesn't exist, create it
        IF NOT EXISTS (SELECT 1 FROM pg_sequences WHERE sequencename = 'admin_users_id_seq') THEN
            CREATE SEQUENCE admin_users_id_seq;
            ALTER SEQUENCE admin_users_id_seq OWNED BY admin_users.id;
            ALTER TABLE admin_users ALTER COLUMN id SET DEFAULT nextval('admin_users_id_seq'::regclass);
        END IF;
    END IF;
END $$;

-- Now insert the admin user (this will auto-generate the id)
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
