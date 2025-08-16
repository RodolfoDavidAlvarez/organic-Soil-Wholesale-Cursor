-- Create inventory_alerts table if not exists
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  location_id UUID REFERENCES locations(id),
  size_option VARCHAR(50),
  alert_type VARCHAR(50) NOT NULL, -- 'low_stock', 'out_of_stock', 'critical', 'overstock'
  current_quantity INTEGER NOT NULL,
  threshold_value INTEGER NOT NULL,
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create alert_settings table
CREATE TABLE IF NOT EXISTS alert_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id),
  location_id UUID REFERENCES locations(id),
  size_option VARCHAR(50),
  low_stock_threshold INTEGER DEFAULT 50,
  critical_stock_threshold INTEGER DEFAULT 10,
  overstock_threshold INTEGER DEFAULT 1000,
  email_notifications BOOLEAN DEFAULT true,
  sms_notifications BOOLEAN DEFAULT false,
  notification_emails TEXT[],
  notification_phones TEXT[],
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(product_id, location_id, size_option)
);

-- Create function to check and create alerts
CREATE OR REPLACE FUNCTION check_inventory_alerts()
RETURNS TRIGGER AS $$
DECLARE
  settings alert_settings;
  existing_alert inventory_alerts;
BEGIN
  -- Get alert settings for this inventory item
  SELECT * INTO settings
  FROM alert_settings
  WHERE product_id = NEW.product_id
    AND location_id = NEW.location_id
    AND size_option = NEW.size_option;
  
  -- If no specific settings, use defaults
  IF settings IS NULL THEN
    settings.low_stock_threshold := 50;
    settings.critical_stock_threshold := 10;
    settings.overstock_threshold := 1000;
  END IF;
  
  -- Check for existing unresolved alerts
  SELECT * INTO existing_alert
  FROM inventory_alerts
  WHERE product_id = NEW.product_id
    AND location_id = NEW.location_id
    AND size_option = NEW.size_option
    AND is_resolved = false
  LIMIT 1;
  
  -- Check for out of stock
  IF NEW.quantity_available = 0 THEN
    IF existing_alert.alert_type != 'out_of_stock' OR existing_alert IS NULL THEN
      -- Resolve any existing alert
      UPDATE inventory_alerts
      SET is_resolved = true, resolved_at = NOW()
      WHERE id = existing_alert.id;
      
      -- Create new alert
      INSERT INTO inventory_alerts (
        product_id, location_id, size_option, alert_type,
        current_quantity, threshold_value, message
      ) VALUES (
        NEW.product_id, NEW.location_id, NEW.size_option,
        'out_of_stock', NEW.quantity_available, 0,
        'Product is out of stock'
      );
    END IF;
  
  -- Check for critical stock
  ELSIF NEW.quantity_available <= settings.critical_stock_threshold THEN
    IF existing_alert.alert_type != 'critical' OR existing_alert IS NULL THEN
      -- Resolve any existing alert
      UPDATE inventory_alerts
      SET is_resolved = true, resolved_at = NOW()
      WHERE id = existing_alert.id;
      
      -- Create new alert
      INSERT INTO inventory_alerts (
        product_id, location_id, size_option, alert_type,
        current_quantity, threshold_value, message
      ) VALUES (
        NEW.product_id, NEW.location_id, NEW.size_option,
        'critical', NEW.quantity_available, settings.critical_stock_threshold,
        FORMAT('Critical stock level: %s units remaining', NEW.quantity_available)
      );
    END IF;
  
  -- Check for low stock
  ELSIF NEW.quantity_available <= settings.low_stock_threshold THEN
    IF existing_alert.alert_type != 'low_stock' OR existing_alert IS NULL THEN
      -- Resolve any existing alert
      UPDATE inventory_alerts
      SET is_resolved = true, resolved_at = NOW()
      WHERE id = existing_alert.id;
      
      -- Create new alert
      INSERT INTO inventory_alerts (
        product_id, location_id, size_option, alert_type,
        current_quantity, threshold_value, message
      ) VALUES (
        NEW.product_id, NEW.location_id, NEW.size_option,
        'low_stock', NEW.quantity_available, settings.low_stock_threshold,
        FORMAT('Low stock: %s units remaining', NEW.quantity_available)
      );
    END IF;
  
  -- Check for overstock
  ELSIF NEW.quantity_available >= settings.overstock_threshold THEN
    IF existing_alert.alert_type != 'overstock' OR existing_alert IS NULL THEN
      -- Resolve any existing alert
      UPDATE inventory_alerts
      SET is_resolved = true, resolved_at = NOW()
      WHERE id = existing_alert.id;
      
      -- Create new alert
      INSERT INTO inventory_alerts (
        product_id, location_id, size_option, alert_type,
        current_quantity, threshold_value, message
      ) VALUES (
        NEW.product_id, NEW.location_id, NEW.size_option,
        'overstock', NEW.quantity_available, settings.overstock_threshold,
        FORMAT('Overstock: %s units in inventory', NEW.quantity_available)
      );
    END IF;
  
  -- Stock is normal, resolve any existing alerts
  ELSE
    UPDATE inventory_alerts
    SET is_resolved = true, resolved_at = NOW()
    WHERE product_id = NEW.product_id
      AND location_id = NEW.location_id
      AND size_option = NEW.size_option
      AND is_resolved = false;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on inventory table
CREATE TRIGGER inventory_alert_check
AFTER INSERT OR UPDATE OF quantity_available ON inventory
FOR EACH ROW
EXECUTE FUNCTION check_inventory_alerts();

-- Create indexes for performance
CREATE INDEX idx_alerts_unresolved ON inventory_alerts(is_resolved) WHERE is_resolved = false;
CREATE INDEX idx_alerts_product_location ON inventory_alerts(product_id, location_id, size_option);
CREATE INDEX idx_alert_settings_product_location ON alert_settings(product_id, location_id, size_option);

-- Enable RLS
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_settings ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admin full access to alerts" ON inventory_alerts
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
    )
  );

CREATE POLICY "Admin full access to alert settings" ON alert_settings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_profiles
      WHERE admin_profiles.id = auth.uid()
    )
  );