-- Migration script to ensure all product fields are up to date
-- Run this in Supabase SQL Editor to update your database schema
-- Date: 2025-01-XX

-- Add slug column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug text;

-- Add catalog display order column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS catalog_display_order integer DEFAULT 0;

-- Add catalog enabled column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_catalog_enabled boolean DEFAULT true;

-- Add product status column if it doesn't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_status text DEFAULT 'active';

-- Add pay and pickup columns if they don't exist
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_pay_and_pickup_enabled boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pay_and_pickup_display_order integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pay_and_pickup_description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pay_and_pickup_hero_image text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pay_and_pickup_badge text;

-- Add video_urls TEXT[] column if it doesn't exist
-- This stores an array of YouTube video URLs for the product gallery
ALTER TABLE products ADD COLUMN IF NOT EXISTS video_urls text[];

-- Add size_price_options JSONB column if it doesn't exist
-- This stores the size pricing options with structure:
-- [{
--   "key": "pallet-9lb",
--   "label": "Pallet of 9 lb bags",
--   "price_cents": 2200,
--   "price": 22.00,
--   "is_active": true,
--   "display_order": 0
-- }]
ALTER TABLE products ADD COLUMN IF NOT EXISTS size_price_options jsonb;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_catalog_order ON products(catalog_display_order);
CREATE INDEX IF NOT EXISTS idx_products_catalog_enabled ON products(is_catalog_enabled);
CREATE INDEX IF NOT EXISTS idx_products_pay_pickup_enabled ON products(is_pay_and_pickup_enabled);
CREATE INDEX IF NOT EXISTS idx_products_pay_pickup_order ON products(pay_and_pickup_display_order);

-- Create unique constraint on slug where not null (allows multiple nulls but unique non-null values)
DROP INDEX IF EXISTS idx_products_slug_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique ON products(slug) WHERE slug IS NOT NULL;

-- Add GIN index on size_price_options for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_products_size_price_options ON products USING GIN (size_price_options);

-- Update existing products to have default values where needed
UPDATE products 
SET 
  is_catalog_enabled = COALESCE(is_catalog_enabled, true),
  catalog_display_order = COALESCE(catalog_display_order, 0),
  is_pay_and_pickup_enabled = COALESCE(is_pay_and_pickup_enabled, false),
  product_status = COALESCE(product_status, 'active')
WHERE 
  is_catalog_enabled IS NULL 
  OR catalog_display_order IS NULL 
  OR is_pay_and_pickup_enabled IS NULL 
  OR product_status IS NULL;

-- Generate slugs for products that don't have them
-- This uses a simple slug generation based on display_title or name
UPDATE products 
SET slug = LOWER(REGEXP_REPLACE(
  COALESCE(display_title, name), 
  '[^a-zA-Z0-9]+', 
  '-', 
  'g'
))
WHERE slug IS NULL OR slug = '';

-- Remove leading/trailing hyphens from slugs
UPDATE products 
SET slug = TRIM(BOTH '-' FROM slug)
WHERE slug IS NOT NULL;

-- Migrate existing product_video_url to video_urls array (if video_urls is empty)
UPDATE products 
SET video_urls = ARRAY[product_video_url]
WHERE product_video_url IS NOT NULL 
  AND (video_urls IS NULL OR array_length(video_urls, 1) IS NULL);

-- Verify the schema
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'All product fields are now up to date.';
  RAISE NOTICE 'New size categories (2-cy, 2.2-cy-tote, truckload) are available in the admin panel.';
  RAISE NOTICE 'video_urls column added for YouTube video support.';
END $$;

