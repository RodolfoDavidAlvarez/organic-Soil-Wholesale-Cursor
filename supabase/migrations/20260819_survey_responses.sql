-- Dedicated OSW client survey responses. CSAT / store feedback is stored
-- separately from marketing consent so a survey submit never joins the newsletter.

create extension if not exists pgcrypto;

create table if not exists public.sp_survey_responses (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  email text not null,
  email_normalized text not null,
  phone text,
  visit_feedback text not null,
  what_felt_easy text,
  what_felt_confusing text,
  what_to_add_next text,
  would_come_back text,
  would_send_friend text,
  source text not null default 'osw-survey',
  user_agent text,
  customer_id integer references public.sp_customers(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists sp_survey_responses_created_idx
  on public.sp_survey_responses (created_at desc);

create index if not exists sp_survey_responses_email_idx
  on public.sp_survey_responses (email_normalized);

create index if not exists sp_survey_responses_customer_idx
  on public.sp_survey_responses (customer_id)
  where customer_id is not null;

alter table public.sp_survey_responses enable row level security;

revoke all on table public.sp_survey_responses from anon, authenticated, public;
grant select, insert on table public.sp_survey_responses to service_role;

comment on table public.sp_survey_responses is
  'OSW public CSAT / yard feedback. Service-role writes from the website API only. Repeat submissions are allowed. Not a marketing list. SSW World campaigns roster UI is a follow-up.';

comment on column public.sp_survey_responses.customer_id is
  'Optional link to sp_customers.id when the submitted email already exists. Missing customer rows do not fail the insert.';

comment on column public.sp_survey_responses.source is
  'Canonical source is osw-survey. Page query tags may be appended after a colon.';
