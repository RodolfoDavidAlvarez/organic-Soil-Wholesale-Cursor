-- Notification preferences for work order notification recipients
-- notify_by_email: send email when a new work order is created (only if recipient has email)
-- notify_by_phone: use phone for notifications when implemented (only if recipient has phone)

ALTER TABLE ops_work_order_notification_recipients
  ADD COLUMN IF NOT EXISTS notify_by_email BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_by_phone BOOLEAN NOT NULL DEFAULT false;

-- Backfill: enable phone preference for existing recipients who have a phone number
UPDATE ops_work_order_notification_recipients
SET notify_by_phone = (phone IS NOT NULL AND trim(phone) <> '')
WHERE notify_by_phone = false AND phone IS NOT NULL AND trim(phone) <> '';
