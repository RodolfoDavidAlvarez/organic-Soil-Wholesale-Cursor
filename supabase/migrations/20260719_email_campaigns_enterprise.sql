-- Enterprise email campaigns: versions + audit trail
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS approved_by text;
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS last_preflight_at timestamptz;
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS last_preflight_ok boolean;
ALTER TABLE newsletter_campaigns ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1;

CREATE TABLE IF NOT EXISTS newsletter_campaign_versions (
  id bigserial PRIMARY KEY,
  campaign_id bigint REFERENCES newsletter_campaigns(id) ON DELETE CASCADE,
  newsletter_id text NOT NULL,
  version integer NOT NULL,
  subject text,
  preview_text text,
  html_body text,
  segment text,
  scheduled_at timestamptz,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nl_versions_campaign
  ON newsletter_campaign_versions (campaign_id, version DESC);

CREATE TABLE IF NOT EXISTS newsletter_campaign_audit (
  id bigserial PRIMARY KEY,
  campaign_id bigint REFERENCES newsletter_campaigns(id) ON DELETE SET NULL,
  newsletter_id text,
  action text NOT NULL,
  actor text,
  detail jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nl_audit_campaign
  ON newsletter_campaign_audit (newsletter_id, created_at DESC);
