-- Day-3 pickup reminder for August worm-castings community gift.
ALTER TABLE public.sp_worm_castings_redemptions
  ADD COLUMN IF NOT EXISTS day3_reminder_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS day3_reminder_provider_id text;

CREATE INDEX IF NOT EXISTS sp_worm_castings_day3_due_idx
  ON public.sp_worm_castings_redemptions (campaign_key, issued_at)
  WHERE redeemed_at IS NULL
    AND day3_reminder_sent_at IS NULL
    AND distribution_status = 'sent';
