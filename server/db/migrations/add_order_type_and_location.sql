-- Add order_type and location_id columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'quick_order', 'pos'
ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id);

-- Create index for location_id
CREATE INDEX IF NOT EXISTS idx_orders_location ON orders(location_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);