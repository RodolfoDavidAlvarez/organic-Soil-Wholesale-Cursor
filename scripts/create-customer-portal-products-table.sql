-- Create customer_portal_products table for optimized customer-facing product data
CREATE TABLE IF NOT EXISTS customer_portal_products (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  display_title VARCHAR(255),
  category VARCHAR(255),
  marketing_title VARCHAR(255),
  marketing_note TEXT,
  seo_keywords TEXT,
  description TEXT,
  image_url VARCHAR(500),
  texture_photo_url VARCHAR(500),
  pay_and_pickup_description TEXT,
  pay_and_pickup_display_order INTEGER DEFAULT 0,
  is_pay_and_pickup_enabled BOOLEAN DEFAULT false,
  pay_and_pickup_hero_image VARCHAR(500),
  pay_and_pickup_badge VARCHAR(255),
  catalog_display_order INTEGER DEFAULT 0,
  is_catalog_enabled BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  size_price_options JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_customer_portal_products_pay_and_pickup 
ON customer_portal_products (is_pay_and_pickup_enabled, pay_and_pickup_display_order);

CREATE INDEX IF NOT EXISTS idx_customer_portal_products_active 
ON customer_portal_products (active);

CREATE INDEX IF NOT EXISTS idx_customer_portal_products_product_id 
ON customer_portal_products (product_id);



