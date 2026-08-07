create table if not exists public.checkout_monitor_sessions (
  session_id uuid primary key,
  status text not null default 'active' check (status in (
    'active', 'payment_pending', 'redirected', 'canceled', 'failed', 'completed', 'abandoned'
  )),
  stage text not null default 'checkout_entered',
  fulfillment_type text check (fulfillment_type in ('pickup', 'delivery')),
  item_count integer not null default 0 check (item_count >= 0),
  cart_value numeric(12, 2) not null default 0 check (cart_value >= 0),
  order_id bigint,
  stripe_checkout_session_id text,
  error_code text,
  error_message text,
  entered_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  completed_at timestamptz,
  immediate_alerted_at timestamptz,
  abandoned_alerted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists checkout_monitor_stale_idx
  on public.checkout_monitor_sessions (status, last_seen_at)
  where abandoned_alerted_at is null;

create index if not exists checkout_monitor_order_idx
  on public.checkout_monitor_sessions (order_id)
  where order_id is not null;

alter table public.checkout_monitor_sessions enable row level security;

comment on table public.checkout_monitor_sessions is
  'Privacy-light OSW checkout health events. No IP, user agent, fingerprint, email, phone, or address.';
