-- Email campaigns: DB-first designer/scheduler/metrics (no Airtable)
-- Safe to re-run: IF NOT EXISTS / additive only

-- Campaign design + schedule fields
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS html_body text;
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS preview_text text;
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS segment text;
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS from_address text DEFAULT 'Soil Seed & Water <info@soilseedandwater.com>';
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS created_by text;
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS total_complained integer NOT NULL DEFAULT 0;
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS total_unsubscribed integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_scheduled
  ON newsletter_campaigns (scheduled_at)
  WHERE status = 'scheduled' AND scheduled_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_newsletter_campaigns_status
  ON newsletter_campaigns (status, sent_at DESC NULLS LAST);

-- Per-recipient marketing sends (separate from transactional email_sends)
CREATE TABLE IF NOT EXISTS newsletter_email_sends (
  id bigserial PRIMARY KEY,
  campaign_id bigint REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
  newsletter_id text NOT NULL,
  customer_id integer REFERENCES sp_customers(id) ON DELETE SET NULL,
  email text NOT NULL,
  resend_email_id text,
  status text NOT NULL DEFAULT 'queued',
  error text,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  bounced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email_sends_campaign
  ON newsletter_email_sends (campaign_id);

CREATE INDEX IF NOT EXISTS idx_newsletter_email_sends_newsletter
  ON newsletter_email_sends (newsletter_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_newsletter_email_sends_resend
  ON newsletter_email_sends (resend_email_id)
  WHERE resend_email_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_newsletter_email_sends_email
  ON newsletter_email_sends (lower(email));

CREATE INDEX IF NOT EXISTS idx_newsletter_email_sends_status
  ON newsletter_email_sends (status);

-- Optional click URL on events
ALTER TABLE email_events ADD COLUMN IF NOT EXISTS click_url text;
ALTER TABLE email_events ADD COLUMN IF NOT EXISTS tags jsonb;
