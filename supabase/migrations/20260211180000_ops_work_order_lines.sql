-- Work Order Line Items
-- One work order can have multiple lines: each line = product + size category + quantity

CREATE TABLE IF NOT EXISTS ops_work_order_lines (
  id SERIAL PRIMARY KEY,
  work_order_id INTEGER NOT NULL REFERENCES ops_work_orders(id) ON DELETE CASCADE,

  -- Product (per line)
  product_type TEXT NOT NULL DEFAULT 'standard',
  product_name TEXT,
  product_id TEXT,
  airtable_product_id TEXT,
  ingredient_ratios TEXT,
  ingredients_list TEXT,

  -- Size (per line)
  size_category TEXT NOT NULL,
  size_category_name TEXT,
  units_per_pallet INTEGER,
  estimated_pallet_weight TEXT,

  -- Quantity (per line)
  quantity INTEGER NOT NULL,
  quantity_type TEXT DEFAULT 'pallet',

  -- Calculated (per line)
  mixing_guidelines TEXT,
  total_weight_lbs NUMERIC,

  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_work_order_lines_work_order_id ON ops_work_order_lines(work_order_id);

-- Backfill: for existing work orders that have product/size/quantity on the header, create one line so all WOs have lines
INSERT INTO ops_work_order_lines (
  work_order_id,
  product_type,
  product_name,
  product_id,
  airtable_product_id,
  ingredient_ratios,
  ingredients_list,
  size_category,
  size_category_name,
  units_per_pallet,
  estimated_pallet_weight,
  quantity,
  quantity_type,
  mixing_guidelines,
  total_weight_lbs,
  sort_order
)
SELECT
  id,
  COALESCE(product_type, 'standard'),
  product_name,
  product_id,
  airtable_product_id,
  ingredient_ratios,
  ingredients_list,
  size_category,
  size_category_name,
  units_per_pallet,
  estimated_pallet_weight,
  quantity,
  COALESCE(quantity_type, 'pallet'),
  mixing_guidelines,
  total_weight_lbs,
  0
FROM ops_work_orders
WHERE NOT EXISTS (
  SELECT 1 FROM ops_work_order_lines l WHERE l.work_order_id = ops_work_orders.id
);
