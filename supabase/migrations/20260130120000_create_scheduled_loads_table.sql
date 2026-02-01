-- Create Scheduled Loads Table for Logistics Calendar
-- This migration creates the table for managing scheduled deliveries and pickups

-- =====================================================
-- Table: scheduled_loads
-- Track scheduled logistics for the operations calendar
-- =====================================================
CREATE TABLE IF NOT EXISTS scheduled_loads (
  id SERIAL PRIMARY KEY,

  -- Scheduling Information
  date TIMESTAMP NOT NULL,
  time_slot TEXT,                           -- e.g., "6:00 AM", "Morning"

  -- Route/Load Type
  route_type TEXT NOT NULL,                 -- 'outbound' or 'inbound'

  -- Load Details
  customer TEXT NOT NULL,                   -- Customer or supplier name
  destination TEXT NOT NULL,                -- Address or location description
  material TEXT NOT NULL,                   -- What's being transported
  quantity TEXT,                            -- e.g., "~25 tons", "Full load"

  -- Driver/Carrier
  driver TEXT,
  carrier_name TEXT,
  truck_number TEXT,

  -- Status Tracking
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled

  -- Deal/Project Reference
  deal TEXT,                                -- Reference to deal/project (e.g., "Willcox Pistachio")

  -- Contact Information
  contact_name TEXT,
  contact_phone TEXT,

  -- Notes
  notes TEXT,

  -- Metadata
  created_by TEXT,                          -- email of admin who created it
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_scheduled_loads_date ON scheduled_loads(date);
CREATE INDEX IF NOT EXISTS idx_scheduled_loads_route_type ON scheduled_loads(route_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_loads_status ON scheduled_loads(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_loads_deal ON scheduled_loads(deal);
CREATE INDEX IF NOT EXISTS idx_scheduled_loads_customer ON scheduled_loads(customer);

-- Add trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_scheduled_loads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_scheduled_loads_updated_at ON scheduled_loads;
CREATE TRIGGER trigger_scheduled_loads_updated_at
  BEFORE UPDATE ON scheduled_loads
  FOR EACH ROW
  EXECUTE FUNCTION update_scheduled_loads_updated_at();
