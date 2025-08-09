-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  phone VARCHAR(20),
  type VARCHAR(50) DEFAULT 'warehouse', -- 'warehouse', 'retail', 'both'
  is_active BOOLEAN DEFAULT true,
  pickup_instructions TEXT,
  business_hours JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create inventory table for location-specific stock
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  quantity_reserved INTEGER NOT NULL DEFAULT 0,
  reorder_point INTEGER DEFAULT 10,
  reorder_quantity INTEGER DEFAULT 50,
  last_restocked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, location_id),
  CONSTRAINT positive_quantities CHECK (quantity_available >= 0 AND quantity_reserved >= 0)
);

-- Create inventory transactions table for tracking all movements
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id SERIAL PRIMARY KEY,
  inventory_id INTEGER NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL, -- 'sale', 'reservation', 'restock', 'adjustment', 'cancellation'
  quantity INTEGER NOT NULL,
  reference_type VARCHAR(50), -- 'order', 'pos', 'manual', 'system'
  reference_id VARCHAR(255), -- order_id, pos_transaction_id, etc.
  notes TEXT,
  performed_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table if not exists (for better order tracking)
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  size_option VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reserved', 'picked', 'completed'
  reserved_at TIMESTAMP WITH TIME ZONE,
  picked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add payment info to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50), -- 'stripe', 'cash', 'card_on_pickup'
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'paid', 'failed', 'refunded'
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pickup_scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pickup_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmation_code VARCHAR(20);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_product_location ON inventory(product_id, location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_created ON inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_confirmation_code ON orders(confirmation_code);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle inventory reservation
CREATE OR REPLACE FUNCTION reserve_inventory(
    p_order_id INTEGER,
    p_product_id INTEGER,
    p_location_id INTEGER,
    p_quantity INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_inventory_id INTEGER;
    v_available INTEGER;
BEGIN
    -- Get inventory record with lock
    SELECT id, quantity_available INTO v_inventory_id, v_available
    FROM inventory
    WHERE product_id = p_product_id AND location_id = p_location_id
    FOR UPDATE;

    -- Check if enough inventory available
    IF v_available < p_quantity THEN
        RETURN FALSE;
    END IF;

    -- Update inventory
    UPDATE inventory
    SET quantity_available = quantity_available - p_quantity,
        quantity_reserved = quantity_reserved + p_quantity
    WHERE id = v_inventory_id;

    -- Record transaction
    INSERT INTO inventory_transactions (
        inventory_id, transaction_type, quantity, 
        reference_type, reference_id, notes
    ) VALUES (
        v_inventory_id, 'reservation', -p_quantity,
        'order', p_order_id::VARCHAR, 'Order reservation'
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Create function to release inventory reservation
CREATE OR REPLACE FUNCTION release_inventory_reservation(
    p_order_id INTEGER,
    p_product_id INTEGER,
    p_location_id INTEGER,
    p_quantity INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_inventory_id INTEGER;
BEGIN
    -- Get inventory record
    SELECT id INTO v_inventory_id
    FROM inventory
    WHERE product_id = p_product_id AND location_id = p_location_id;

    -- Update inventory
    UPDATE inventory
    SET quantity_available = quantity_available + p_quantity,
        quantity_reserved = quantity_reserved - p_quantity
    WHERE id = v_inventory_id;

    -- Record transaction
    INSERT INTO inventory_transactions (
        inventory_id, transaction_type, quantity, 
        reference_type, reference_id, notes
    ) VALUES (
        v_inventory_id, 'cancellation', p_quantity,
        'order', p_order_id::VARCHAR, 'Order cancellation - inventory released'
    );
END;
$$ LANGUAGE plpgsql;

-- Insert Phoenix location
INSERT INTO locations (name, address, city, state, zip, phone, type, pickup_instructions, business_hours)
VALUES (
    'Phoenix Warehouse',
    '123 Main Street', -- Update with real address
    'Phoenix',
    'AZ',
    '85001',
    '(602) 555-0123', -- Update with real phone
    'both',
    'Drive to the back of the building. Look for the "Order Pickup" sign. Call when you arrive.',
    '{
        "monday": {"open": "7:00 AM", "close": "5:00 PM"},
        "tuesday": {"open": "7:00 AM", "close": "5:00 PM"},
        "wednesday": {"open": "7:00 AM", "close": "5:00 PM"},
        "thursday": {"open": "7:00 AM", "close": "5:00 PM"},
        "friday": {"open": "7:00 AM", "close": "5:00 PM"},
        "saturday": {"open": "8:00 AM", "close": "2:00 PM"},
        "sunday": {"closed": true}
    }'::jsonb
)
ON CONFLICT DO NOTHING;