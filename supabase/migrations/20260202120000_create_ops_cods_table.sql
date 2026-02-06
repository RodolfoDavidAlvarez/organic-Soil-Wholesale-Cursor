-- Create Certificate of Destruction (COD) System Table
-- This migration creates the ops_cods table for managing destruction certificates

-- =====================================================
-- Table: ops_cods
-- Certificate of Destruction for organic material recycling
-- =====================================================
CREATE TABLE IF NOT EXISTS ops_cods (
  id SERIAL PRIMARY KEY,
  cod_number TEXT NOT NULL UNIQUE,           -- COD-20260202-001

  -- Receipt Information
  date_received TIMESTAMP NOT NULL,          -- Date material was received
  received_from TEXT NOT NULL,               -- Company name (e.g., "Vanguard Renewables")
  destruction_location TEXT NOT NULL,        -- Where destruction occurred

  -- Customer Reference Numbers
  sales_order TEXT,                          -- Customer's sales order number
  freight_order TEXT,                        -- Freight/shipping order number
  vanguard_work_order TEXT,                  -- Vanguard work order number

  -- Materials (JSONB array of objects)
  -- Each object: { material: string, quantity: number, uom: string }
  materials JSONB NOT NULL DEFAULT '[]',

  -- Authorization
  authorized_by_name TEXT,                   -- Name of person authorizing
  authorized_by_title TEXT,                  -- Title of authorizing person
  authorized_date DATE,                      -- Date of authorization

  -- Additional Info
  notes TEXT,                                -- Optional notes
  status TEXT NOT NULL DEFAULT 'completed',  -- 'draft', 'pending', 'completed'

  -- Metadata
  created_by TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ops_cods_cod_number ON ops_cods(cod_number);
CREATE INDEX IF NOT EXISTS idx_ops_cods_status ON ops_cods(status);
CREATE INDEX IF NOT EXISTS idx_ops_cods_created_at ON ops_cods(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ops_cods_received_from ON ops_cods(received_from);
CREATE INDEX IF NOT EXISTS idx_ops_cods_date_received ON ops_cods(date_received DESC);
CREATE INDEX IF NOT EXISTS idx_ops_cods_vanguard_work_order ON ops_cods(vanguard_work_order);

-- Enable Row Level Security (optional, depending on your Supabase setup)
-- ALTER TABLE ops_cods ENABLE ROW LEVEL SECURITY;

-- Comments for documentation
COMMENT ON TABLE ops_cods IS 'Certificate of Destruction records for organic material recycling';
COMMENT ON COLUMN ops_cods.cod_number IS 'Unique identifier in format COD-YYYYMMDD-NNN';
COMMENT ON COLUMN ops_cods.materials IS 'JSON array of materials: [{material, quantity, uom}]';
COMMENT ON COLUMN ops_cods.received_from IS 'Company or entity that delivered the materials';
COMMENT ON COLUMN ops_cods.destruction_location IS 'SSW facility where destruction/recycling occurs';
