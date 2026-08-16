-- Dedicated event registrations. Event attendance and marketing consent are
-- deliberately separate so an RSVP never depends on joining the newsletter.

create extension if not exists pgcrypto;

create table if not exists public.sp_event_registrations (
  id uuid primary key default gen_random_uuid(),
  event_key text not null,
  event_name text not null,
  event_starts_at timestamptz not null,
  full_name text not null,
  email text not null,
  email_normalized text not null,
  phone text not null,
  customer_type text,
  source text not null default 'website',
  event_updates_consent boolean not null default false,
  event_updates_consented_at timestamptz,
  marketing_consent boolean not null default false,
  marketing_consented_at timestamptz,
  marketing_sync_status text not null default 'not_requested',
  marketing_sync_error text,
  customer_id integer references public.sp_customers(id) on delete set null,
  status text not null default 'confirmed',
  admin_notification_status text not null default 'pending',
  admin_notification_provider_id text,
  admin_notification_error text,
  admin_notification_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sp_event_registrations_event_email_unique unique (event_key, email_normalized),
  constraint sp_event_registrations_status_check
    check (status in ('confirmed', 'cancelled', 'attended', 'no_show')),
  constraint sp_event_registrations_marketing_sync_check
    check (marketing_sync_status in ('not_requested', 'pending', 'subscribed', 'opted_out', 'failed')),
  constraint sp_event_registrations_admin_notification_check
    check (admin_notification_status in ('pending', 'sending', 'sent', 'failed', 'skipped')),
  constraint sp_event_registrations_event_consent_check
    check (event_updates_consent = true and event_updates_consented_at is not null),
  constraint sp_event_registrations_marketing_consent_check
    check (
      (marketing_consent = false and marketing_consented_at is null)
      or (marketing_consent = true and marketing_consented_at is not null)
    )
);

create index if not exists sp_event_registrations_event_created_idx
  on public.sp_event_registrations (event_key, created_at desc);

create index if not exists sp_event_registrations_status_idx
  on public.sp_event_registrations (status, created_at desc);

create index if not exists sp_event_registrations_email_idx
  on public.sp_event_registrations (email_normalized);

create or replace function public.touch_sp_event_registrations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_sp_event_registrations_updated_at on public.sp_event_registrations;
create trigger touch_sp_event_registrations_updated_at
before update on public.sp_event_registrations
for each row execute function public.touch_sp_event_registrations_updated_at();

alter table public.sp_event_registrations enable row level security;
grant select, insert, update on public.sp_event_registrations to service_role;

comment on table public.sp_event_registrations is
  'Canonical SSW event roster. Event communication consent is separate from optional marketing consent.';

comment on column public.sp_event_registrations.admin_notification_status is
  'Delivery audit for the internal new-registration alert.';

-- Preserve the RSVP previously stored only as a newsletter source. This is a
-- one-time, conflict-safe backfill; it does not change the customer opt-in.
insert into public.sp_event_registrations (
  event_key,
  event_name,
  event_starts_at,
  full_name,
  email,
  email_normalized,
  phone,
  customer_type,
  source,
  event_updates_consent,
  event_updates_consented_at,
  marketing_consent,
  marketing_consented_at,
  marketing_sync_status,
  customer_id,
  status,
  admin_notification_status,
  created_at,
  updated_at
)
select
  'fall-garden-workshop-2026-08-22',
  'Grow your best fall garden in Arizona',
  '2026-08-22 10:00:00-07'::timestamptz,
  coalesce(nullif(trim(c.full_name), ''), split_part(lower(trim(c.email)), '@', 1)),
  lower(trim(c.email)),
  lower(trim(c.email)),
  coalesce(nullif(trim(c.phone), ''), 'Not provided'),
  c.newsletter_contact_type,
  coalesce(nullif(trim(c.newsletter_source), ''), 'legacy-workshop-rsvp'),
  true,
  coalesce(c.updated_at, c.created_at, now()),
  c.newsletter_subscribed is true,
  case when c.newsletter_subscribed is true then coalesce(c.updated_at, c.created_at, now()) else null end,
  case when c.newsletter_subscribed is true then 'subscribed' else 'not_requested' end,
  c.id,
  'confirmed',
  'skipped',
  coalesce(c.created_at, c.updated_at, now()),
  coalesce(c.updated_at, c.created_at, now())
from public.sp_customers c
where c.email is not null
  and lower(coalesce(c.newsletter_source, '')) like 'fall-garden-workshop-2026-08-%'
on conflict (event_key, email_normalized) do nothing;
