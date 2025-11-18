-- Migration: Add Admin Landing Page Support
-- This migration adds landing page fields to admin_users and links contacts to admins

-- Step 1: Add landing page fields to admin_users
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_images TEXT[],
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(50),
ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS contact_button_text VARCHAR(100) DEFAULT 'Contact Me',
ADD COLUMN IF NOT EXISTS contact_card_button_text VARCHAR(100) DEFAULT 'Download Contact Card',
ADD COLUMN IF NOT EXISTS contact_form_title VARCHAR(100) DEFAULT 'Get In Touch',
ADD COLUMN IF NOT EXISTS contact_form_description TEXT,
ADD COLUMN IF NOT EXISTS has_landing_page BOOLEAN DEFAULT false;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_slug ON admin_users(slug) WHERE slug IS NOT NULL;

-- Step 2: Update representative_contacts to support admin_id
-- Note: admin_users.id is UUID type, so admin_id must also be UUID
ALTER TABLE representative_contacts
ADD COLUMN IF NOT EXISTS admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE;

-- Make representative_id nullable (contacts can come from either source)
-- Note: This might fail if there are existing NOT NULL constraints
-- If it fails, we'll need to handle it differently
DO $$
BEGIN
  -- Check if representative_id has NOT NULL constraint
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'representative_contacts' 
    AND column_name = 'representative_id' 
    AND is_nullable = 'NO'
  ) THEN
    -- Make it nullable
    ALTER TABLE representative_contacts
    ALTER COLUMN representative_id DROP NOT NULL;
  END IF;
END $$;

-- Add constraint: either representative_id OR admin_id must be set
DO $$
BEGIN
  -- Drop constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_contact_source'
  ) THEN
    ALTER TABLE representative_contacts DROP CONSTRAINT check_contact_source;
  END IF;
  
  -- Add the constraint
  ALTER TABLE representative_contacts
  ADD CONSTRAINT check_contact_source 
  CHECK (
    (representative_id IS NOT NULL AND admin_id IS NULL) OR
    (representative_id IS NULL AND admin_id IS NOT NULL)
  );
END $$;

-- Create index for admin_id lookups
CREATE INDEX IF NOT EXISTS idx_representative_contacts_admin_id ON representative_contacts(admin_id) WHERE admin_id IS NOT NULL;

-- Step 3: Add comment for documentation
COMMENT ON COLUMN representative_contacts.admin_id IS 'Links contact to admin user if submitted from admin landing page';
COMMENT ON COLUMN representative_contacts.representative_id IS 'Links contact to representative if submitted from representative landing page';

