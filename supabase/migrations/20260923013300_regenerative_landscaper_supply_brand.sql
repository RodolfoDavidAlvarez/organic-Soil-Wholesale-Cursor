-- Give the shared SSW operations database durable attribution for this brand.
-- Existing OSW records stay null and retain their current routing and pricing.
alter table public.orders
  add column if not exists brand_id text;

alter table public.contact_messages
  add column if not exists brand_id text;

alter table public.quote_requests
  add column if not exists brand_id text;

alter table public.ops_work_orders
  add column if not exists brand_id text;

alter table public.sp_pickup_orders
  add column if not exists brand_id text;

comment on column public.orders.brand_id is
  'Public-facing SSW brand that originated the order; e.g. organic_soil_wholesale or regenerative_landscaper_supply.';
comment on column public.contact_messages.brand_id is
  'Public-facing SSW brand that originated the lead or callback request.';
comment on column public.quote_requests.brand_id is
  'Public-facing SSW brand that originated the quote request.';
comment on column public.ops_work_orders.brand_id is
  'Public-facing SSW brand carried from the originating order into fulfillment.';
comment on column public.sp_pickup_orders.brand_id is
  'Public-facing SSW brand carried into the sales portal pickup queue.';

create index if not exists idx_orders_brand_created_at
  on public.orders (brand_id, created_at desc) where brand_id is not null;
create index if not exists idx_contact_messages_brand_created_at
  on public.contact_messages (brand_id, created_at desc) where brand_id is not null;
create index if not exists idx_quote_requests_brand_created_at
  on public.quote_requests (brand_id, created_at desc) where brand_id is not null;
create index if not exists idx_ops_work_orders_brand_created_at
  on public.ops_work_orders (brand_id, created_at desc) where brand_id is not null;
create index if not exists idx_sp_pickup_orders_brand_created_at
  on public.sp_pickup_orders (brand_id, created_at desc) where brand_id is not null;

-- Repair attribution only where the origin was already explicitly recorded.
update public.orders
set brand_id = 'regenerative_landscaper_supply'
where brand_id is null
  and coalesce(notes, '') ilike '%Source brand: Regenerative Landscaper Supply%';

update public.contact_messages
set brand_id = 'regenerative_landscaper_supply'
where brand_id is null
  and coalesce(subject, '') ilike '[RLS]%';

update public.ops_work_orders
set brand_id = 'regenerative_landscaper_supply'
where brand_id is null
  and coalesce(custom_notes, '') ilike 'Regenerative Landscaper Supply Order:%';
