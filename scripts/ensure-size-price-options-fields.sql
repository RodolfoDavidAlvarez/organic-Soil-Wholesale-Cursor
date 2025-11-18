-- Ensure size_price_options JSONB column supports description and display_order
-- Run this in Supabase SQL Editor to verify/update the schema

-- The size_price_options column should already exist as JSONB
-- This script verifies the structure and provides example data

-- Example structure for size_price_options:
-- [
--   {
--     "key": "pallet-9lb",
--     "label": "Pallet of 9 lb bags",
--     "description": "144 units (36 cases of 4 units)",
--     "price_cents": 2200,
--     "price": 22.00,
--     "image": null,
--     "is_active": true,
--     "display_order": 0
--   }
-- ]

-- Verify the column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' 
    AND column_name = 'size_price_options'
  ) THEN
    ALTER TABLE products ADD COLUMN size_price_options JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added size_price_options column';
  ELSE
    RAISE NOTICE 'size_price_options column already exists';
  END IF;
END $$;

-- Create index for performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_products_size_price_options 
ON products USING gin (size_price_options);

-- Verify existing data structure (optional - for debugging)
-- SELECT 
--   id,
--   name,
--   size_price_options
-- FROM products 
-- WHERE size_price_options IS NOT NULL 
-- LIMIT 5;

