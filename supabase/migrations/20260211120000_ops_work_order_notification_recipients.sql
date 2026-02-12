-- Work Order Notification Recipients
-- People to notify when a new work order is created (Operations Settings)

CREATE TABLE IF NOT EXISTS ops_work_order_notification_recipients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ops_wo_notification_recipients_email ON ops_work_order_notification_recipients(email);
