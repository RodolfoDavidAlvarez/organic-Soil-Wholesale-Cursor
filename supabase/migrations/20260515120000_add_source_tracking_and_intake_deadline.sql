-- Phase 1: Wire OSW orders + future channels into ops_work_orders as unified intake queue.
-- Adds source-channel attribution and an accept-by deadline so CompostDeveloper.com
-- can render a 15-min accept/reject queue regardless of which channel created the WO.

ALTER TABLE ops_work_orders
  ADD COLUMN IF NOT EXISTS source_channel TEXT,
  ADD COLUMN IF NOT EXISTS source_order_id INTEGER,
  ADD COLUMN IF NOT EXISTS source_order_number TEXT,
  ADD COLUMN IF NOT EXISTS accept_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_by TEXT,
  ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS rejected_by TEXT,
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

COMMENT ON COLUMN ops_work_orders.source_channel IS 'Where the WO came from: mos (MyOrganicSoil), osw (Organic Soil Wholesale), cd (CompostDeveloper manual), social (lead conversion). Used by intake queue UI to attribute orders.';
COMMENT ON COLUMN ops_work_orders.source_order_id IS 'FK back to originating order row: sp_orders.id when source_channel=mos, orders.id when source_channel=osw.';
COMMENT ON COLUMN ops_work_orders.source_order_number IS 'Human-readable originating order number for reverse lookup without joins.';
COMMENT ON COLUMN ops_work_orders.accept_deadline IS '15 minutes after WO INSERT. Drives the operator countdown timer for accept/reject SLA.';

CREATE INDEX IF NOT EXISTS idx_ops_work_orders_intake_queue
  ON ops_work_orders(status, accept_deadline)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_ops_work_orders_source
  ON ops_work_orders(source_channel, source_order_id);

-- Backfill: existing pending WOs created by MOS get source_channel='mos'.
-- Their order_type is already set to 'sales_portal' so the mapping is unambiguous.
UPDATE ops_work_orders
SET source_channel = 'mos'
WHERE source_channel IS NULL AND order_type = 'sales_portal';

-- Anything else pre-existing is treated as direct CD-created.
UPDATE ops_work_orders
SET source_channel = 'cd'
WHERE source_channel IS NULL;
