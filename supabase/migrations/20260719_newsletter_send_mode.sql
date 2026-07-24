-- Distinguish portal-owned sends from externally scheduled (Resend CLI) campaigns
ALTER TABLE newsletter_campaigns
  ADD COLUMN IF NOT EXISTS send_mode text NOT NULL DEFAULT 'portal';

COMMENT ON COLUMN newsletter_campaigns.send_mode IS
  'portal = Admin Portal send/cron may send; external = already queued elsewhere — do not re-send';
