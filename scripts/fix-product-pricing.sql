-- Fix product pricing by adding size_price_options column and syncing with inventory
-- This script resolves the "$0.00" display issue in the customer portal

-- Step 1: Add the missing size_price_options JSONB column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS size_price_options JSONB DEFAULT '[]'::jsonb;

-- Step 2: Add index for performance on the new column
CREATE INDEX IF NOT EXISTS idx_products_size_price_options 
ON products USING gin (size_price_options);

-- Step 3: Populate size_price_options from inventory data for pay-and-pickup enabled products
UPDATE products 
SET size_price_options = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'key', lower(replace(replace(replace(i.size_option, ' ', '-'), '(', ''), ')', '')),
      'label', i.size_option,
      'price', ROUND(i.price, 2),
      'price_cents', ROUND(i.price * 100),
      'is_active', true,
      'display_order', 
        CASE i.size_option
          WHEN '9lb Bag' THEN 1
          WHEN '25lb Bag' THEN 2
          WHEN '1 CF Bag' THEN 3
          WHEN 'Bulk (50lb)' THEN 4
          WHEN 'Bulk Pickup' THEN 5
          WHEN 'Bulk Delivery' THEN 6
          ELSE 99
        END
    )
    ORDER BY 
      CASE i.size_option
        WHEN '9lb Bag' THEN 1
        WHEN '25lb Bag' THEN 2
        WHEN '1 CF Bag' THEN 3
        WHEN 'Bulk (50lb)' THEN 4
        WHEN 'Bulk Pickup' THEN 5
        WHEN 'Bulk Delivery' THEN 6
        ELSE 99
      END
  )
  FROM inventory i
  WHERE i.product_id = products.id
    AND i.location_id = 1  -- Phoenix location
    AND i.quantity_available > 0
    AND i.price > 0
)
WHERE is_pay_and_pickup_enabled = true
  AND EXISTS (
    SELECT 1 FROM inventory i 
    WHERE i.product_id = products.id 
      AND i.location_id = 1 
      AND i.price > 0
  );

-- Step 4: Update available_size_options to match size_price_options
UPDATE products
SET available_size_options = (
  SELECT array_agg(option->>'label' ORDER BY (option->>'display_order')::int)
  FROM jsonb_array_elements(size_price_options) AS option
  WHERE (option->>'is_active')::boolean = true
)
WHERE size_price_options IS NOT NULL 
  AND jsonb_array_length(size_price_options) > 0;

-- Step 5: Verify the results
SELECT 
  id,
  name,
  display_title,
  is_pay_and_pickup_enabled,
  jsonb_array_length(size_price_options) as size_options_count,
  available_size_options,
  (
    SELECT string_agg(
      (option->>'label') || ': $' || (option->>'price'), 
      ', ' 
      ORDER BY (option->>'display_order')::int
    )
    FROM jsonb_array_elements(size_price_options) AS option
    WHERE (option->>'is_active')::boolean = true
  ) as pricing_summary
FROM products 
WHERE is_pay_and_pickup_enabled = true
ORDER BY pay_and_pickup_display_order, id;

-- Show products that still need inventory setup
SELECT 
  p.id,
  p.name,
  p.display_title,
  p.is_pay_and_pickup_enabled,
  COUNT(i.id) as inventory_entries,
  jsonb_array_length(p.size_price_options) as size_options_count
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id AND i.location_id = 1
WHERE p.is_pay_and_pickup_enabled = true
GROUP BY p.id, p.name, p.display_title, p.is_pay_and_pickup_enabled, p.size_price_options
HAVING COUNT(i.id) = 0 OR jsonb_array_length(p.size_price_options) = 0
ORDER BY p.id;