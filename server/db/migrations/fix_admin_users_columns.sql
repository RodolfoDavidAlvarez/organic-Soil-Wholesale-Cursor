-- Fix Admin Users Table - Add Missing Columns
-- This migration adds all missing columns to admin_users table
-- Run this if you're getting "column admin_users.slug does not exist" errors

-- Step 1: Add landing page fields to admin_users (if they don't exist)
ALTER TABLE admin_users 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255),
ADD COLUMN IF NOT EXISTS full_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS banner_image_url TEXT,
ADD COLUMN IF NOT EXISTS gallery_images TEXT[],
ADD COLUMN IF NOT EXISTS video_urls TEXT[],
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

-- Step 2: Add unique constraint on slug (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'admin_users_slug_key'
  ) THEN
    -- First, make sure we can add the constraint
    -- Remove any duplicate slugs if they exist
    UPDATE admin_users 
    SET slug = NULL 
    WHERE slug IN (
      SELECT slug 
      FROM admin_users 
      WHERE slug IS NOT NULL 
      GROUP BY slug 
      HAVING COUNT(*) > 1
    );
    
    -- Now add the unique constraint
    ALTER TABLE admin_users 
    ADD CONSTRAINT admin_users_slug_key UNIQUE (slug);
  END IF;
END $$;

-- Step 3: Create index for slug lookups (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_admin_users_slug ON admin_users(slug) WHERE slug IS NOT NULL;

-- Step 4: Initialize video_urls as empty array for existing rows
UPDATE admin_users 
SET video_urls = ARRAY[]::TEXT[] 
WHERE video_urls IS NULL;

-- Step 5: Initialize social_links as empty object for existing rows
UPDATE admin_users 
SET social_links = '{}'::JSONB 
WHERE social_links IS NULL;

-- Step 6: Add comment for documentation
COMMENT ON COLUMN admin_users.slug IS 'URL-friendly identifier for admin landing page (e.g., /rep/slug)';
COMMENT ON COLUMN admin_users.video_urls IS 'Array of YouTube video URLs for the contact card';
COMMENT ON COLUMN admin_users.has_landing_page IS 'Whether this admin has a public landing page enabled';

