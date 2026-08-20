-- Dedicated event registrations. Event attendance and marketing consent are
-- deliberately separate so an RSVP never depends on joining the newsletter.
-- Production already has this table; IF NOT EXISTS keeps the file idempotent.

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

comment on table public.sp_event_registrations is
  'Canonical SSW event roster. Event communication consent is separate from optional marketing consent.';
