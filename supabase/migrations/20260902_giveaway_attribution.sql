-- Preserve social-channel attribution without changing the canonical giveaway
-- source used by the one-entry-per-email database constraint.

alter table public.sp_giveaway_entries
  add column if not exists attribution_source text not null default 'direct',
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists utm_content text;

create index if not exists sp_giveaway_entries_attribution_idx
  on public.sp_giveaway_entries (utm_campaign, utm_source, created_at desc);

comment on column public.sp_giveaway_entries.attribution_source is
  'Human-readable referring link, such as instagram-bio or facebook-bio.';

comment on column public.sp_giveaway_entries.utm_source is
  'Standard UTM source captured from the /win landing URL.';
