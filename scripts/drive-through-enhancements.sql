-- Drive-Through System Enhancements
-- Run this in Supabase SQL editor to add drive-through specific functionality

-- 1. Add drive-through specific fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS order_type TEXT DEFAULT 'regular' CHECK (order_type IN ('regular', 'drive_through', 'delivery', 'pickup')),
ADD COLUMN IF NOT EXISTS arrival_time TIMESTAMP,
ADD COLUMN IF NOT EXISTS parking_spot TEXT,
ADD COLUMN IF NOT EXISTS vehicle_description TEXT,
ADD COLUMN IF NOT EXISTS pickup_instructions TEXT,
ADD COLUMN IF NOT EXISTS estimated_preparation_time INTEGER DEFAULT 15, -- minutes
ADD COLUMN IF NOT EXISTS qr_session_id TEXT,
ADD COLUMN IF NOT EXISTS customer_phone_formatted TEXT,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": false}'::jsonb;

-- 2. Create SMS notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id SERIAL PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT,
  email TEXT,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  order_confirmation BOOLEAN DEFAULT true,
  order_ready BOOLEAN DEFAULT true,
  order_pickup_reminder BOOLEAN DEFAULT false,
  marketing_emails BOOLEAN DEFAULT false,
  marketing_sms BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id)
);

-- 3. Create drive-through queue management table
CREATE TABLE IF NOT EXISTS drive_through_queue (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  vehicle_description TEXT,
  parking_spot TEXT,
  queue_position INTEGER,
  status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'preparing', 'ready', 'completed', 'cancelled')),
  estimated_ready_time TIMESTAMP,
  actual_ready_time TIMESTAMP,
  pickup_time TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create order status history table for tracking
CREATE TABLE IF NOT EXISTS order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  change_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create notification log table
CREATE TABLE IF NOT EXISTS notification_log (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('email', 'sms', 'push')),
  template_name TEXT NOT NULL,
  recipient TEXT NOT NULL, -- email or phone
  subject TEXT,
  content TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  provider TEXT, -- 'resend', 'twilio', etc.
  provider_id TEXT, -- external provider message ID
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP
);

-- 6. Create inventory alerts table
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  location_id INTEGER NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  size_option TEXT NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'reorder', 'overstocked')),
  threshold_value INTEGER,
  current_quantity INTEGER,
  message TEXT,
  is_resolved BOOLEAN DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, location_id, size_option, alert_type, is_resolved) DEFERRABLE INITIALLY DEFERRED
);

-- 7. Create pricing tiers table (for volume discounts)
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size_option TEXT NOT NULL,
  tier_name TEXT NOT NULL, -- 'retail', 'bulk', 'wholesale', 'contractor'
  min_quantity INTEGER NOT NULL DEFAULT 1,
  max_quantity INTEGER,
  discount_percentage DECIMAL(5,2) DEFAULT 0.00,
  fixed_price DECIMAL(10,2),
  customer_type TEXT, -- 'regular', 'contractor', 'wholesale', 'member'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 8. Create customer drive-through preferences
CREATE TABLE IF NOT EXISTS customer_drive_through_preferences (
  id SERIAL PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_parking_spot TEXT,
  vehicle_description TEXT,
  special_instructions TEXT,
  notification_phone TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id)
);

-- 9. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_order_type ON orders(order_type);
CREATE INDEX IF NOT EXISTS idx_orders_arrival_time ON orders(arrival_time);
CREATE INDEX IF NOT EXISTS idx_orders_qr_session ON orders(qr_session_id);
CREATE INDEX IF NOT EXISTS idx_drive_through_queue_status ON drive_through_queue(status);
CREATE INDEX IF NOT EXISTS idx_drive_through_queue_position ON drive_through_queue(queue_position);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_order ON notification_log(order_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_status ON notification_log(status);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_resolved ON inventory_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_pricing_tiers_product ON pricing_tiers(product_id, size_option);

-- 10. Create functions for automatic queue management
CREATE OR REPLACE FUNCTION update_queue_positions()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate queue positions when status changes
  IF NEW.status = 'completed' OR NEW.status = 'cancelled' THEN
    UPDATE drive_through_queue 
    SET queue_position = queue_position - 1 
    WHERE queue_position > OLD.queue_position 
    AND status = 'queued';
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_queue_positions_trigger 
AFTER UPDATE ON drive_through_queue
FOR EACH ROW EXECUTE FUNCTION update_queue_positions();

-- 11. Create function to auto-create order status history
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO order_status_history (order_id, old_status, new_status, notes)
    VALUES (NEW.id, OLD.status, NEW.status, 'Automatic status change');
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER log_order_status_change_trigger 
AFTER UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- 12. Create function to check inventory and create alerts
CREATE OR REPLACE FUNCTION check_inventory_levels()
RETURNS TRIGGER AS $$
BEGIN
  -- Check for low stock (less than 20% of reorder point)
  IF NEW.quantity_available <= (NEW.reorder_point * 0.2) AND NEW.quantity_available > 0 THEN
    INSERT INTO inventory_alerts (product_id, location_id, size_option, alert_type, threshold_value, current_quantity, message)
    VALUES (NEW.product_id, NEW.location_id, NEW.size_option, 'low_stock', NEW.reorder_point, NEW.quantity_available, 
            'Stock is critically low')
    ON CONFLICT (product_id, location_id, size_option, alert_type, is_resolved) DO NOTHING;
  END IF;
  
  -- Check for out of stock
  IF NEW.quantity_available = 0 THEN
    INSERT INTO inventory_alerts (product_id, location_id, size_option, alert_type, threshold_value, current_quantity, message)
    VALUES (NEW.product_id, NEW.location_id, NEW.size_option, 'out_of_stock', 0, 0, 
            'Product is out of stock')
    ON CONFLICT (product_id, location_id, size_option, alert_type, is_resolved) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER check_inventory_levels_trigger 
AFTER UPDATE ON inventory
FOR EACH ROW EXECUTE FUNCTION check_inventory_levels();

-- 13. Update triggers for timestamp management
CREATE TRIGGER update_notification_preferences_updated_at BEFORE UPDATE ON notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drive_through_queue_updated_at BEFORE UPDATE ON drive_through_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_tiers_updated_at BEFORE UPDATE ON pricing_tiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_drive_through_preferences_updated_at BEFORE UPDATE ON customer_drive_through_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 14. Insert sample pricing tiers
INSERT INTO pricing_tiers (product_id, size_option, tier_name, min_quantity, max_quantity, discount_percentage, customer_type) 
SELECT 
  p.id,
  unnest(p.available_size_options),
  'bulk',
  10,
  NULL,
  10.00,
  'regular'
FROM products p
WHERE p.allow_bulk_pickup = true
ON CONFLICT DO NOTHING;

-- 15. Row Level Security Policies
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_through_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_drive_through_preferences ENABLE ROW LEVEL SECURITY;

-- Public read access to pricing tiers
CREATE POLICY "Public can view pricing tiers" ON pricing_tiers
  FOR SELECT USING (is_active = true);

-- Customers can manage their own preferences
CREATE POLICY "Customers can manage own notification preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = customer_id);

CREATE POLICY "Customers can manage own drive-through preferences" ON customer_drive_through_preferences
  FOR ALL USING (auth.uid() = customer_id);

-- Admins can view and manage everything
CREATE POLICY "Admins can manage drive through queue" ON drive_through_queue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can view order status history" ON order_status_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can manage inventory alerts" ON inventory_alerts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admins can view notification log" ON notification_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.id = auth.uid()
      AND admin_users.is_active = true
    )
  );

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Create view for drive-through dashboard
CREATE OR REPLACE VIEW drive_through_dashboard AS
SELECT 
  q.id,
  q.order_id,
  q.customer_name,
  q.customer_phone,
  q.vehicle_description,
  q.parking_spot,
  q.queue_position,
  q.status,
  q.estimated_ready_time,
  q.created_at,
  o.total as order_total,
  o.order_items,
  COUNT(*) OVER() as total_in_queue
FROM drive_through_queue q
JOIN orders o ON q.order_id = o.id
WHERE q.status IN ('queued', 'preparing', 'ready')
ORDER BY q.queue_position, q.created_at;

GRANT SELECT ON drive_through_dashboard TO authenticated;