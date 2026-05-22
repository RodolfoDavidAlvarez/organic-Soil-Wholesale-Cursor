-- Customer Portal: Applications, Order enhancements
-- Run against OSW Supabase (govktyrtmwzbzqkmzmrf)

-- 1. Customer Applications table
CREATE TABLE IF NOT EXISTS customer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES customer_profiles(id) ON DELETE CASCADE,

  -- Business info
  legal_entity_name TEXT,
  dba_name TEXT,
  ein_tax_id TEXT,
  business_type TEXT,
  years_in_business INTEGER,

  -- Operations contact
  ops_contact_name TEXT,
  ops_contact_title TEXT,
  ops_contact_email TEXT,
  ops_contact_phone TEXT,

  -- AP contact
  ap_contact_name TEXT,
  ap_contact_title TEXT,
  ap_contact_email TEXT,
  ap_contact_phone TEXT,

  -- Payment preferences
  preferred_payment_method TEXT,
  preferred_payment_terms TEXT,

  -- Shipping
  has_forklift BOOLEAN DEFAULT false,
  delivery_instructions TEXT,

  -- Credit references (JSONB array)
  credit_references JSONB DEFAULT '[]'::jsonb,

  -- Status
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'approved', 'rejected')),
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(customer_id)
);

-- 2. Add application_status to customer_profiles
DO $$ BEGIN
  ALTER TABLE customer_profiles ADD COLUMN IF NOT EXISTS application_status TEXT DEFAULT 'none';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 3. Add portal order fields to orders table
DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_profile_id UUID REFERENCES customer_profiles(id);
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'pickup';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_address_json JSONB;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS preferred_date DATE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS preferred_time_start TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS preferred_time_end TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE orders ADD COLUMN IF NOT EXISTS special_instructions TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 4. Add format column to order_items
DO $$ BEGIN
  ALTER TABLE order_items ADD COLUMN IF NOT EXISTS format TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- 5. Order status history table
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_customer_applications_customer_id ON customer_applications(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_profile_id ON orders(customer_profile_id);
