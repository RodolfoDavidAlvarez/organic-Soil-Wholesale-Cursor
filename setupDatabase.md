# Database Setup Instructions

## Run these SQL commands in Supabase SQL Editor

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/govktyrtmwzbzqkmzmrf/sql/new
2. Copy and paste each section below and run them in order:

### Step 1: Create Locations Table
```sql
-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  phone VARCHAR(20),
  type VARCHAR(50) DEFAULT 'warehouse',
  is_active BOOLEAN DEFAULT true,
  pickup_instructions TEXT,
  business_hours JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 2: Create Inventory Table
```sql
-- Create inventory table for location-specific stock
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL,
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
```

### Step 3: Create Inventory Transactions Table
```sql
-- Create inventory transactions table for tracking all movements
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id SERIAL PRIMARY KEY,
  inventory_id INTEGER NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  transaction_type VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  reference_type VARCHAR(50),
  reference_id VARCHAR(255),
  notes TEXT,
  performed_by VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 4: Create/Update Orders Table
```sql
-- First, create products table if it doesn't exist
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  category VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table if it doesn't exist
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  business_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  total DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add payment and pickup columns to orders
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS stripe_checkout_session_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pickup_scheduled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS pickup_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS confirmation_code VARCHAR(20);
```

### Step 5: Create Order Items Table
```sql
-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  size_option VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending',
  reserved_at TIMESTAMP WITH TIME ZONE,
  picked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Step 6: Create Indexes
```sql
-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_product_location ON inventory(product_id, location_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_inventory ON inventory_transactions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
```

### Step 7: Insert Phoenix Location
```sql
-- Insert Phoenix location
INSERT INTO locations (name, address, city, state, zip, phone, type, pickup_instructions, business_hours)
VALUES (
    'Phoenix Warehouse',
    '123 Main Street',
    'Phoenix',
    'AZ',
    '85001',
    '(602) 555-0123',
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
);
```

### Step 8: Insert Initial Products
```sql
-- Insert the three initial products
INSERT INTO products (name, description, price, category) VALUES
('Dan''s Gold Dairy Compost', 'Premium dairy compost, 1 cubic foot bag', 19.99, 'Compost'),
('Plant Pal Potting Soil', 'All-purpose potting soil, 2 cubic foot bag', 29.99, 'Soil'),
('Oasis Blend', 'Specialized blend for date and palm trees, 1 cubic foot bag', 24.99, 'Specialty Soil')
ON CONFLICT DO NOTHING;
```

### Step 9: Add Initial Inventory
```sql
-- Add inventory for Phoenix location (assuming location_id = 1 and products start at id 1)
INSERT INTO inventory (product_id, location_id, quantity_available, quantity_reserved) VALUES
(1, 1, 50, 0), -- Dan's Gold
(2, 1, 50, 0), -- Plant Pal
(3, 1, 50, 0)  -- Oasis Blend
ON CONFLICT (product_id, location_id) DO NOTHING;
```

## Next Steps
After running these migrations:
1. Update the Phoenix location address and phone number
2. Update product prices if needed
3. Set up Stripe for payment processing
4. Configure SMS/email notifications