-- Add catalog_order_number to products for deterministic catalog sort order.
-- Run in Supabase SQL Editor (or via migration) then use the column to sort the Products page.

-- Add column (integer; nulls sort last in ASC, so default to large number)
ALTER TABLE products ADD COLUMN IF NOT EXISTS catalog_order_number integer;

-- Populate from catalog_display_order, then id (works even without product_id/sku)
UPDATE products
SET catalog_order_number = COALESCE(catalog_display_order, id)
WHERE catalog_order_number IS NULL;

-- If you add product_id or sku later (e.g. SSW-1, SSW-2), run this to overwrite from them:
-- UPDATE products SET catalog_order_number = (regexp_match(trim(upper(COALESCE(product_id, sku, ''))), '^SSW-?(\d+)$'))[1]::integer WHERE product_id IS NOT NULL OR sku IS NOT NULL;

-- Set any remaining nulls to id
UPDATE products SET catalog_order_number = id WHERE catalog_order_number IS NULL;

-- Default for new rows
ALTER TABLE products ALTER COLUMN catalog_order_number SET DEFAULT 999999;

CREATE INDEX IF NOT EXISTS idx_products_catalog_order_number ON products(catalog_order_number);
