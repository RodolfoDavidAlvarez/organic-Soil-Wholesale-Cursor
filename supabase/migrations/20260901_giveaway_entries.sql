-- Phoenix Fall Garden Giveaway entries for /win.
-- Service-role writes from the website API only. Public insert is blocked by RLS.
-- Live rows are unique per source + email. Entries are OPEN unless
-- GIVEAWAY_ENTRIES_OPEN=false. Production does not need that env set.

create extension if not exists pgcrypto;

create table if not exists public.sp_giveaway_entries (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'win-giveaway',
  campaign_key text not null default 'phoenix-fall-garden-2026',
  is_preview boolean not null default false,
  full_name text not null,
  email text not null,
  email_normalized text not null,
  phone text not null,
  zip_code text not null,
  customer_type text not null,
  garden_status text not null,
  growing text[] not null default '{}',
  growing_other text,
  notes text,
  email_consent boolean not null default false,
  rules_consent boolean not null default false,
  followed_ig boolean not null default false,
  followed_fb boolean not null default false,
  followed_yt boolean not null default false,
  followed_tt boolean not null default false,
  user_agent text,
  customer_id integer references public.sp_customers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sp_giveaway_entries_customer_type_check
    check (customer_type in ('homeowner', 'landscaper', 'specialty-farmer')),
  constraint sp_giveaway_entries_garden_status_check
    check (garden_status in ('brand-new', 'existing')),
  constraint sp_giveaway_entries_live_consents_check
    check (
      is_preview = true
      or (email_consent = true and rules_consent = true)
    )
);

create unique index if not exists sp_giveaway_entries_live_email_unique
  on public.sp_giveaway_entries (source, email_normalized)
  where is_preview = false;

create index if not exists sp_giveaway_entries_created_idx
  on public.sp_giveaway_entries (created_at desc);

create index if not exists sp_giveaway_entries_source_idx
  on public.sp_giveaway_entries (source, is_preview, created_at desc);

alter table public.sp_giveaway_entries enable row level security;

revoke all on table public.sp_giveaway_entries from anon, authenticated, public;
grant select, insert on table public.sp_giveaway_entries to service_role;

comment on table public.sp_giveaway_entries is
  'Phoenix Fall Garden Giveaway entries from /win. Service-role API writes only. One live entry per email. No customer email is sent from this table.';

comment on column public.sp_giveaway_entries.source is
  'Canonical public source is win-giveaway.';

comment on column public.sp_giveaway_entries.is_preview is
  'Live accepted entries are is_preview=false. The public API does not insert while GIVEAWAY_ENTRIES_OPEN is false.';
