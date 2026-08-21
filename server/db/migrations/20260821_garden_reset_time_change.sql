UPDATE sp_event_registrations
SET
  event_starts_at = '2026-08-22T08:00:00-07:00'::timestamptz,
  updated_at = NOW()
WHERE event_key = 'fall-garden-workshop-2026-08-22';
