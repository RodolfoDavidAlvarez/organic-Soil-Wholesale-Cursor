-- Ensure size_price_options JSONB column supports image field
-- Run this in Supabase SQL Editor to verify/update the schema

-- The size_price_options column should already exist as JSONB
-- This script verifies the structure supports image field

-- Example structure for size_price_options with image:
-- [
--   {
--     "key": "pallet-9lb",
--     "label": "Pallet of 9 lb bags",
--     "description": "144 units (36 cases of 4 units)",
--     "price_cents": 2200,
--     "price": 22.00,
--     "image": "https://your-domain.com/uploads/products/123/size-pallet-9lb.webp",
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

-- Verify existing data structure includes image field (optional - for debugging)
-- SELECT 
--   id,
--   name,
--   jsonb_array_elements(size_price_options) as size_option
-- FROM products 
-- WHERE size_price_options IS NOT NULL 
--   AND jsonb_array_length(size_price_options) > 0
-- LIMIT 10;

-- Note: The image field is optional in the JSONB structure
-- Images are automatically optimized (resized, converted to WebP) when uploaded
-- Image URLs are stored as strings in the image field of each size option


