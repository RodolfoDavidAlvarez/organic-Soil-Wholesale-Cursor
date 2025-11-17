-- Add missing columns to products table for enhanced functionality

-- Add slug column
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug text;

-- Add catalog display order column
ALTER TABLE products ADD COLUMN IF NOT EXISTS catalog_display_order integer DEFAULT 0;

-- Add pay and pickup columns
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_pay_and_pickup_enabled boolean DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pay_and_pickup_display_order integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pay_and_pickup_description text;
ALTER TABLE products ADD COLUMN IF NOT EXISTS pay_and_pickup_hero_image text;

-- Add catalog enabled column  
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_catalog_enabled boolean DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS product_status text DEFAULT 'active';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_catalog_order ON products(catalog_display_order);
CREATE INDEX IF NOT EXISTS idx_products_pay_pickup_order ON products(pay_and_pickup_display_order);
CREATE INDEX IF NOT EXISTS idx_products_catalog_enabled ON products(is_catalog_enabled);
CREATE INDEX IF NOT EXISTS idx_products_pay_pickup_enabled ON products(is_pay_and_pickup_enabled);

-- Create unique constraint on slug where not null
DROP INDEX IF EXISTS idx_products_slug_unique;
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique ON products(slug) WHERE slug IS NOT NULL;
