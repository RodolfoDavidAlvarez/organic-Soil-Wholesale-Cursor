-- 24h post-purchase survey letter outbox for SSW Sales Portal (sp_orders) buyers.
-- Unique on lower(email). Cron-only. Customer send is gated by SURVEY_LETTER_SEND_ACTIVE.

alter table public.sp_survey_responses
  add column if not exists follow_up_status text not null default 'weekly_review',
  add column if not exists follow_up_alerted_at timestamptz;

create table if not exists public.portal_survey_letter_outbox (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_normalized text not null,
  first_name text,
  source_order_id integer references public.sp_orders(id) on delete set null,
  paid_at timestamptz,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'skipped')),
  skip_reason text,
  provider text not null default 'resend',
  provider_id text,
  last_error text,
  claimed_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email_normalized)
);

create unique index if not exists portal_survey_letter_outbox_email_lower_idx
  on public.portal_survey_letter_outbox (lower(email));

create index if not exists portal_survey_letter_outbox_status_idx
  on public.portal_survey_letter_outbox (status, claimed_at);

alter table public.portal_survey_letter_outbox enable row level security;

revoke all on table public.portal_survey_letter_outbox from anon, authenticated, public;
grant select, insert, update on table public.portal_survey_letter_outbox to service_role;
