-- Create ops_bols table for BOL Management System
CREATE TABLE IF NOT EXISTS ops_bols (
  id SERIAL PRIMARY KEY,
  bol_number TEXT NOT NULL UNIQUE,
  ticket_number TEXT,
  date TIMESTAMP NOT NULL,

  -- Origin Information
  origin_name TEXT NOT NULL DEFAULT 'SSW BioSoils',
  origin_address TEXT NOT NULL DEFAULT '18980 Stanton Rd, Congress, AZ 85332',
  origin_phone TEXT DEFAULT '(928) 632-7125',

  -- Destination Information
  customer_name TEXT NOT NULL,
  destination_address TEXT NOT NULL,
  destination_city TEXT,
  destination_state TEXT,
  destination_zip TEXT,
  onsite_contact_name TEXT,
  onsite_contact_phone TEXT,

  -- Material Information
  material_type TEXT NOT NULL,
  material_description TEXT,
  load_type TEXT NOT NULL DEFAULT 'Bulk Material (Walking Floor)',

  -- Weight Information
  gross_weight INTEGER NOT NULL,
  tare_weight INTEGER NOT NULL,
  net_weight INTEGER NOT NULL,
  net_weight_tons TEXT,

  -- Carrier/Transport Information
  carrier_name TEXT DEFAULT 'James Bond Trucking',
  driver_name TEXT,
  truck_number TEXT,
  license_plate TEXT,
  trailer_number TEXT,

  -- Timing
  time_in TEXT,
  time_out TEXT,

  -- Signatures
  driver_signature TEXT,
  ssw_rep_signature TEXT,
  receiver_signature TEXT,
  scale_operator_initials TEXT,

  -- Additional Information
  notes TEXT,
  reference_number TEXT,

  -- Status & Tracking
  status TEXT NOT NULL DEFAULT 'draft',
  created_by TEXT NOT NULL,
  sent_to_email TEXT,
  sent_at TIMESTAMP,
  delivered_at TIMESTAMP,

  -- Metadata
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index on bol_number for fast lookups
CREATE INDEX IF NOT EXISTS idx_ops_bols_bol_number ON ops_bols(bol_number);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_ops_bols_status ON ops_bols(status);

-- Create index on created_by for filtering by user
CREATE INDEX IF NOT EXISTS idx_ops_bols_created_by ON ops_bols(created_by);

-- Create index on date for date-range queries
CREATE INDEX IF NOT EXISTS idx_ops_bols_date ON ops_bols(date);
