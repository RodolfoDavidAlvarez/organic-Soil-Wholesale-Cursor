-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  customer_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_phone VARCHAR(20),
  order_type VARCHAR(50) DEFAULT 'standard', -- 'standard', 'drive_thru', 'wholesale'
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  payment_method VARCHAR(50), -- 'card', 'cash', 'check', 'account'
  payment_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'refunded', 'failed'
  stripe_payment_intent_id VARCHAR(255),
  estimated_ready_time TIMESTAMP,
  pickup_time TIMESTAMP,
  delivery_time TIMESTAMP,
  delivery_address JSONB,
  notes TEXT,
  admin_notes TEXT,
  vehicle_info VARCHAR(255),
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  size VARCHAR(50),
  price_per_unit DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_order_type ON orders(order_type);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Create function to generate order numbers
CREATE OR REPLACE FUNCTION generate_order_number(order_type VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  prefix VARCHAR;
  sequence_num INTEGER;
  order_num VARCHAR;
BEGIN
  -- Set prefix based on order type
  CASE order_type
    WHEN 'drive_thru' THEN prefix := 'DT';
    WHEN 'wholesale' THEN prefix := 'WS';
    ELSE prefix := 'ORD';
  END CASE;
  
  -- Get next sequence number for today
  SELECT COUNT(*) + 1 INTO sequence_num
  FROM orders
  WHERE DATE(created_at) = CURRENT_DATE;
  
  -- Format: PREFIX-YYYYMMDD-XXXX
  order_num := prefix || '-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(sequence_num::TEXT, 4, '0');
  
  RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate order numbers
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number(NEW.order_type);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_order_number
BEFORE INSERT ON orders
FOR EACH ROW
EXECUTE FUNCTION set_order_number();

-- Create function to update order total
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
DECLARE
  new_subtotal DECIMAL(10, 2);
  new_total DECIMAL(10, 2);
BEGIN
  -- Calculate new subtotal
  SELECT COALESCE(SUM(total_price), 0) INTO new_subtotal
  FROM order_items
  WHERE order_id = COALESCE(NEW.order_id, OLD.order_id);
  
  -- Update order totals
  UPDATE orders
  SET 
    subtotal = new_subtotal,
    total_amount = new_subtotal + COALESCE(tax_amount, 0) - COALESCE(discount_amount, 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to update order totals when items change
CREATE TRIGGER trigger_update_order_total_insert
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

CREATE TRIGGER trigger_update_order_total_update
AFTER UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

CREATE TRIGGER trigger_update_order_total_delete
AFTER DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

-- Enable Row Level Security
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Admin policies for orders
CREATE POLICY "Admin full access to orders" ON orders
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
    )
  );

-- Admin policies for order_items
CREATE POLICY "Admin full access to order_items" ON order_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
    )
  );

-- Customer policies for orders (view their own orders)
CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT TO authenticated
  USING (customer_id = auth.uid());

-- Customer policies for order_items (view items from their orders)
CREATE POLICY "Customers can view own order items" ON order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id = auth.uid()
    )
  );

-- Webhook/service policies (using service role key)
CREATE POLICY "Service role full access to orders" ON orders
  FOR ALL TO service_role
  USING (true);

CREATE POLICY "Service role full access to order_items" ON order_items
  FOR ALL TO service_role
  USING (true);