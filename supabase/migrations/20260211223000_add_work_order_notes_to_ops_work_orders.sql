-- Add a dedicated notes field for overall work order context.
-- This is distinct from custom_notes (which is tied to custom product details).
ALTER TABLE ops_work_orders
ADD COLUMN IF NOT EXISTS work_order_notes TEXT;

