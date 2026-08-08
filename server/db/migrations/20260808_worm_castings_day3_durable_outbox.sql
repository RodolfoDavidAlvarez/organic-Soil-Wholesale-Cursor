-- Durable, idempotent Day-3 reminder delivery for the August worm-castings gift.
CREATE TABLE IF NOT EXISTS public.worm_castings_reminder_outbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  redemption_id uuid NOT NULL REFERENCES public.sp_worm_castings_redemptions(id) ON DELETE CASCADE,
  campaign_key text NOT NULL,
  template_name text NOT NULL,
  recipient text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'sending', 'retry', 'sent', 'delivered', 'bounced',
      'complained', 'suppressed', 'failed', 'dead_letter', 'cancelled'
    )),
  attempt_count integer NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts integer NOT NULL DEFAULT 5 CHECK (max_attempts BETWEEN 1 AND 20),
  available_at timestamptz NOT NULL DEFAULT now(),
  locked_at timestamptz,
  lock_token uuid,
  provider text NOT NULL DEFAULT 'resend',
  provider_id text,
  provider_idempotency_key text NOT NULL,
  last_error text,
  last_status_code integer,
  sent_at timestamptz,
  delivery_event_at timestamptz,
  dead_lettered_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (redemption_id, template_name),
  UNIQUE (provider_idempotency_key)
);

CREATE INDEX IF NOT EXISTS worm_castings_reminder_outbox_due_idx
  ON public.worm_castings_reminder_outbox (available_at, created_at)
  WHERE status IN ('pending', 'retry');

CREATE INDEX IF NOT EXISTS worm_castings_reminder_outbox_stale_idx
  ON public.worm_castings_reminder_outbox (locked_at)
  WHERE status = 'sending';

CREATE INDEX IF NOT EXISTS worm_castings_reminder_outbox_provider_idx
  ON public.worm_castings_reminder_outbox (provider_id)
  WHERE provider_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.worm_castings_reminder_attempts (
  id bigserial PRIMARY KEY,
  outbox_id uuid NOT NULL REFERENCES public.worm_castings_reminder_outbox(id) ON DELETE CASCADE,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  lock_token uuid NOT NULL,
  status text NOT NULL DEFAULT 'sending'
    CHECK (status IN ('sending', 'sent', 'failed', 'abandoned', 'delivered', 'bounced', 'complained', 'suppressed')),
  provider_id text,
  status_code integer,
  error_message text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  UNIQUE (outbox_id, attempt_number)
);

CREATE INDEX IF NOT EXISTS worm_castings_reminder_attempts_provider_idx
  ON public.worm_castings_reminder_attempts (provider_id)
  WHERE provider_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.worm_castings_reminder_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_app text NOT NULL,
  status text NOT NULL DEFAULT 'running'
    CHECK (status IN ('running', 'healthy', 'degraded', 'failed')),
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  error_message text,
  alert_sent_at timestamptz,
  alert_error text,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz
);

CREATE INDEX IF NOT EXISTS worm_castings_reminder_runs_started_idx
  ON public.worm_castings_reminder_runs (started_at DESC);

-- Preserve the already accepted Day-3 sends in the new authoritative ledger.
INSERT INTO public.worm_castings_reminder_outbox (
  redemption_id, campaign_key, template_name, recipient, status,
  attempt_count, provider_id, provider_idempotency_key, sent_at,
  delivery_event_at, last_error, created_at, updated_at
)
SELECT
  r.id,
  r.campaign_key,
  'worm_castings_day3_reminder',
  r.email_normalized,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM public.email_events e
      WHERE e.resend_email_id = r.day3_reminder_provider_id AND e.event_type = 'complained'
    ) THEN 'complained'
    WHEN EXISTS (
      SELECT 1 FROM public.email_events e
      WHERE e.resend_email_id = r.day3_reminder_provider_id AND e.event_type = 'suppressed'
    ) THEN 'suppressed'
    WHEN EXISTS (
      SELECT 1 FROM public.email_events e
      WHERE e.resend_email_id = r.day3_reminder_provider_id AND e.event_type = 'bounced'
    ) THEN 'bounced'
    WHEN EXISTS (
      SELECT 1 FROM public.email_events e
      WHERE e.resend_email_id = r.day3_reminder_provider_id AND e.event_type = 'failed'
    ) THEN 'failed'
    WHEN EXISTS (
      SELECT 1 FROM public.email_events e
      WHERE e.resend_email_id = r.day3_reminder_provider_id AND e.event_type = 'delivered'
    ) THEN 'delivered'
    ELSE 'sent'
  END,
  1,
  r.day3_reminder_provider_id,
  'worm-day3-' || r.id::text,
  r.day3_reminder_sent_at,
  (
    SELECT max(e.created_at) FROM public.email_events e
    WHERE e.resend_email_id = r.day3_reminder_provider_id
      AND e.event_type IN ('delivered', 'bounced', 'complained', 'suppressed', 'failed')
  ),
  (
    SELECT n.error_message FROM public.notification_log n
    WHERE n.provider_id = r.day3_reminder_provider_id
    ORDER BY n.created_at DESC LIMIT 1
  ),
  r.day3_reminder_sent_at,
  now()
FROM public.sp_worm_castings_redemptions r
WHERE r.campaign_key = 'free-worm-castings-2026-08'
  AND r.day3_reminder_sent_at IS NOT NULL
  AND r.day3_reminder_provider_id IS NOT NULL
ON CONFLICT (redemption_id, template_name) DO NOTHING;

INSERT INTO public.worm_castings_reminder_attempts (
  outbox_id, attempt_number, lock_token, status, provider_id, error_message,
  started_at, finished_at
)
SELECT
  o.id,
  1,
  gen_random_uuid(),
  CASE o.status
    WHEN 'delivered' THEN 'delivered'
    WHEN 'bounced' THEN 'bounced'
    WHEN 'complained' THEN 'complained'
    WHEN 'suppressed' THEN 'suppressed'
    WHEN 'failed' THEN 'failed'
    ELSE 'sent'
  END,
  o.provider_id,
  o.last_error,
  o.sent_at,
  COALESCE(o.delivery_event_at, o.sent_at)
FROM public.worm_castings_reminder_outbox o
WHERE o.template_name = 'worm_castings_day3_reminder'
  AND o.attempt_count = 1
ON CONFLICT (outbox_id, attempt_number) DO NOTHING;
