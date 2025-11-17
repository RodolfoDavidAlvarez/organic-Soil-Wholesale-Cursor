-- Update customer_portal_products table with additional fields needed for admin-managed content
ALTER TABLE customer_portal_products
ADD COLUMN IF NOT EXISTS category VARCHAR(255),
ADD COLUMN IF NOT EXISTS marketing_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS marketing_note TEXT,
ADD COLUMN IF NOT EXISTS seo_keywords TEXT,
ADD COLUMN IF NOT EXISTS pay_and_pickup_hero_image VARCHAR(500),
ADD COLUMN IF NOT EXISTS pay_and_pickup_badge VARCHAR(255),
ADD COLUMN IF NOT EXISTS catalog_display_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_catalog_enabled BOOLEAN DEFAULT true;

-- Ensure active flag stays aligned with catalog visibility
UPDATE customer_portal_products
SET active = COALESCE(is_catalog_enabled, true)
WHERE active IS DISTINCT FROM COALESCE(is_catalog_enabled, true);

