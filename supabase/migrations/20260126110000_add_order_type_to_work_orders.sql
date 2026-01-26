-- Add order_type column to ops_work_orders
-- Order types: 'amazon', 'local', 'wholesale', 'bulk'

ALTER TABLE ops_work_orders
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'wholesale';

-- Add index for filtering by order type
CREATE INDEX IF NOT EXISTS idx_ops_work_orders_order_type ON ops_work_orders(order_type);

-- Add illustration_url column to ops_products_cache for product illustrations
ALTER TABLE ops_products_cache
ADD COLUMN IF NOT EXISTS illustration_url TEXT;
