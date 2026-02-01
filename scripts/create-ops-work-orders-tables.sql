-- Create Work Order System Tables
-- This migration creates tables for the work order management system

-- =====================================================
-- Table: ops_work_orders
-- Main work order table for production orders
-- =====================================================
CREATE TABLE IF NOT EXISTS ops_work_orders (
  id SERIAL PRIMARY KEY,
  wo_number TEXT NOT NULL UNIQUE,          -- WO-20260123-001

  -- Product Selection
  product_type TEXT NOT NULL DEFAULT 'standard',  -- 'standard' or 'custom'
  product_name TEXT,                        -- From Airtable or custom entry
  product_id TEXT,                          -- SSW-001, etc.
  airtable_product_id TEXT,                 -- Airtable record ID

  -- Size Category
  size_category TEXT NOT NULL,              -- '9lb', '7.5qt', '1cf', '1.5cf', '2cf', 'tote', 'bulk', 'other'
  size_category_name TEXT,                  -- "9 lb Bag (Pallet)"
  units_per_pallet INTEGER,                 -- 144, 50, etc.
  estimated_pallet_weight TEXT,             -- "1,296 lbs"

  -- Quantity
  quantity INTEGER NOT NULL,                -- Number of pallets (or units)
  quantity_type TEXT DEFAULT 'pallet',      -- 'pallet' or 'unit'

  -- Ingredient Information (from Airtable)
  ingredient_ratios TEXT,                   -- "100% Worm Castings"
  ingredients_list TEXT,                    -- "Worm Castings, Dairy Compost"

  -- AI-Generated Mixing Guidelines
  mixing_guidelines TEXT,                   -- AI-calculated proportions
  total_weight_lbs NUMERIC,                 -- Calculated total weight

  -- Custom Work Order Notes
  custom_notes TEXT,                        -- For custom product requests

  -- Transportation
  needs_transportation BOOLEAN DEFAULT FALSE,
  destination_address TEXT,
  destination_city TEXT,
  destination_state TEXT,
  destination_zip TEXT,
  preferred_delivery_date DATE,
  preferred_delivery_time TEXT,
  linked_bol_id INTEGER REFERENCES ops_bols(id) ON DELETE SET NULL,

  -- Status & Tracking
  status TEXT NOT NULL DEFAULT 'pending',   -- 'pending', 'scheduled', 'in_progress', 'completed'
  priority TEXT DEFAULT 'normal',           -- 'low', 'normal', 'high', 'urgent'

  -- Metadata
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ops_work_orders_wo_number ON ops_work_orders(wo_number);
CREATE INDEX IF NOT EXISTS idx_ops_work_orders_status ON ops_work_orders(status);
CREATE INDEX IF NOT EXISTS idx_ops_work_orders_created_at ON ops_work_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_work_orders_product_name ON ops_work_orders(product_name);
CREATE INDEX IF NOT EXISTS idx_ops_work_orders_priority ON ops_work_orders(priority);

-- =====================================================
-- Table: ops_products_cache
-- Cached products from Airtable SSW1 base
-- =====================================================
CREATE TABLE IF NOT EXISTS ops_products_cache (
  id SERIAL PRIMARY KEY,
  airtable_id TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  product_id TEXT,                          -- SSW-001
  ingredient_ratios TEXT,
  ingredients_list TEXT,
  size_categories TEXT[],                   -- Array of size category IDs
  certifications TEXT[],
  last_synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_products_cache_airtable_id ON ops_products_cache(airtable_id);
CREATE INDEX IF NOT EXISTS idx_ops_products_cache_product_name ON ops_products_cache(product_name);

-- =====================================================
-- Table: ops_size_categories_cache
-- Cached size categories from Airtable
-- =====================================================
CREATE TABLE IF NOT EXISTS ops_size_categories_cache (
  id SERIAL PRIMARY KEY,
  airtable_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,                       -- "9 lb Bag (Pallet)"
  code TEXT NOT NULL,                       -- '9lb', '1cf', 'tote', etc.
  units_per_pallet INTEGER,
  estimated_pallet_weight TEXT,
  illustration_url TEXT,                    -- Local path or URL
  pallet_configuration TEXT,
  last_synced_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_size_categories_code ON ops_size_categories_cache(code);

-- =====================================================
-- Insert default size categories (local reference)
-- =====================================================
INSERT INTO ops_size_categories_cache (airtable_id, name, code, units_per_pallet, estimated_pallet_weight, illustration_url, pallet_configuration)
VALUES
  ('local_9lb', '9 lb Bag (Pallet)', '9lb', 144, '1,296 lbs', '/size-categories/9lb-pallet.jpg', '4 bags/box, 36 boxes/pallet'),
  ('local_7.5qt', '7.5 Quart Bag (Pallet)', '7.5qt', 144, '1,000 lbs', '/size-categories/7.5qt-pallet.jpg', '4 bags/box, 36 boxes/pallet'),
  ('local_1cf', '1 Cubic Foot Bag (Pallet)', '1cf', 50, '1,250 lbs', '/size-categories/1cf-pallet.png', '50 bags stacked'),
  ('local_1.5cf', '1.5 Cubic Foot Bag (Pallet)', '1.5cf', 40, '1,200 lbs', '/size-categories/1cf-pallet.png', '40 bags stacked'),
  ('local_2cf', '2 Cubic Foot Bag (Pallet)', '2cf', 36, '1,080 lbs', '/size-categories/2cf-pallet.png', '36 bags stacked'),
  ('local_tote', '2.2 Cubic Yard Tote (Super Sack)', 'tote', 1, '2,000 lbs', '/size-categories/tote.png', 'Single supersack'),
  ('local_bulk', 'Bulk (Cubic Yard)', 'bulk', NULL, NULL, '/size-categories/bulk.png', 'Loose material by CY'),
  ('local_other', 'Other / Custom', 'other', NULL, NULL, NULL, 'Custom configuration')
ON CONFLICT (airtable_id) DO UPDATE SET
  name = EXCLUDED.name,
  code = EXCLUDED.code,
  units_per_pallet = EXCLUDED.units_per_pallet,
  estimated_pallet_weight = EXCLUDED.estimated_pallet_weight,
  illustration_url = EXCLUDED.illustration_url,
  pallet_configuration = EXCLUDED.pallet_configuration,
  last_synced_at = NOW();
