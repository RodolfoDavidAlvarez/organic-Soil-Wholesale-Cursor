-- Newsletter + engagement fields on sp_customers (shared CRM / marketing list)
-- Safe to re-run: uses IF NOT EXISTS

ALTER TABLE sp_customers ADD COLUMN IF NOT EXISTS newsletter_subscribed boolean;
ALTER TABLE sp_customers ADD COLUMN IF NOT EXISTS newsletter_unsubscribed_at timestamptz;
ALTER TABLE sp_customers ADD COLUMN IF NOT EXISTS newsletter_vip_tier text;
ALTER TABLE sp_customers ADD COLUMN IF NOT EXISTS newsletter_label text;
ALTER TABLE sp_customers ADD COLUMN IF NOT EXISTS newsletter_contact_type text;
ALTER TABLE sp_customers ADD COLUMN IF NOT EXISTS newsletter_verification_status text;
ALTER TABLE sp_customers ADD COLUMN IF NOT EXISTS newsletter_source text;
ALTER TABLE sp_customers ADD COLUMN IF NOT EXISTS newsletter_email_opens integer NOT NULL DEFAULT 0;
ALTER TABLE sp_customers ADD COLUMN IF NOT EXISTS newsletter_email_clicks integer NOT NULL DEFAULT 0;
ALTER TABLE sp_customers ADD COLUMN IF NOT EXISTS newsletter_last_sent_at timestamptz;
ALTER TABLE sp_customers ADD COLUMN IF NOT EXISTS newsletter_last_opened_at timestamptz;
ALTER TABLE sp_customers ADD COLUMN IF NOT EXISTS newsletter_last_clicked_at timestamptz;
ALTER TABLE sp_customers ADD COLUMN IF NOT EXISTS newsletter_last_open_device text;
ALTER TABLE sp_customers ADD COLUMN IF NOT EXISTS newsletter_notes text;

CREATE INDEX IF NOT EXISTS idx_sp_customers_newsletter_subscribed
  ON sp_customers (newsletter_subscribed)
  WHERE newsletter_subscribed IS TRUE;

CREATE INDEX IF NOT EXISTS idx_sp_customers_email_lower
  ON sp_customers (lower(email));

-- Campaign registry (replaces Airtable Newsletters table)
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id bigserial PRIMARY KEY,
  newsletter_id text NOT NULL UNIQUE,
  subject text,
  status text NOT NULL DEFAULT 'draft',
  total_sent integer NOT NULL DEFAULT 0,
  total_delivered integer NOT NULL DEFAULT 0,
  total_opens integer NOT NULL DEFAULT 0,
  total_clicks integer NOT NULL DEFAULT 0,
  total_bounced integer NOT NULL DEFAULT 0,
  open_rate_pct numeric(5,2),
  click_rate_pct numeric(5,2),
  mobile_opens integer NOT NULL DEFAULT 0,
  desktop_opens integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  notes text,
  airtable_record_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Per-event log from Resend webhooks (opens, clicks, bounces)
CREATE TABLE IF NOT EXISTS email_events (
  id bigserial PRIMARY KEY,
  email text NOT NULL,
  customer_id integer REFERENCES sp_customers(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  newsletter_id text,
  resend_email_id text,
  user_agent text,
  device_type text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_email ON email_events (lower(email));
CREATE INDEX IF NOT EXISTS idx_email_events_type_created ON email_events (event_type, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_events_dedupe
  ON email_events (resend_email_id, event_type)
  WHERE resend_email_id IS NOT NULL;
