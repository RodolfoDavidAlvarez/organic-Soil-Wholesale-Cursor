begin;

create table if not exists public.sp_giveaway_lead_reports (
  id uuid primary key default gen_random_uuid(),
  campaign_key text not null,
  batch_number integer not null,
  batch_size integer not null default 30,
  entry_start integer not null,
  entry_end integer not null,
  status text not null default 'sending',
  recipient_provider_ids jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz,
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sp_giveaway_lead_reports_batch_positive
    check (batch_number > 0 and batch_size > 0 and entry_start > 0 and entry_end >= entry_start),
  constraint sp_giveaway_lead_reports_status_check
    check (status in ('sending', 'scheduled', 'sent', 'partial', 'failed')),
  constraint sp_giveaway_lead_reports_campaign_batch_unique
    unique (campaign_key, batch_number)
);

create index if not exists sp_giveaway_lead_reports_status_idx
  on public.sp_giveaway_lead_reports (campaign_key, status, batch_number);

alter table public.sp_giveaway_lead_reports enable row level security;

revoke all on table public.sp_giveaway_lead_reports from anon, authenticated, public;
grant select, insert, update on table public.sp_giveaway_lead_reports to service_role;

comment on table public.sp_giveaway_lead_reports is
  'Durable Resend delivery ledger for private Big Garden Giveaway Lead Report batches.';

comment on column public.sp_giveaway_lead_reports.recipient_provider_ids is
  'Resend email id by normalized recipient email. Used for retry-safe individual delivery.';

commit;
