-- One landing table for every survey. Reuse sp_survey_responses.
-- Future activities add a survey_kind, not a new table.
-- Independent reads:
--   select * from public.sp_survey_garden_class;
--   select * from public.sp_survey_purchase;
--   select * from public.sp_survey_all;
--   select * from public.sp_survey_kind_counts;

alter table public.sp_survey_responses
  add column if not exists notes text,
  add column if not exists survey_kind text not null default 'purchase',
  add column if not exists event_key text,
  add column if not exists scores jsonb not null default '{}'::jsonb;

update public.sp_survey_responses
set notes = visit_feedback
where (notes is null or btrim(notes) = '')
  and visit_feedback is not null
  and btrim(visit_feedback) <> '';

update public.sp_survey_responses
set survey_kind = 'garden-class'
where source ilike '%garden-class%';

update public.sp_survey_responses
set scores = jsonb_strip_nulls(jsonb_build_object(
  'wouldComeBack', nullif(btrim(coalesce(would_come_back, '')), ''),
  'wouldSendFriend', nullif(btrim(coalesce(would_send_friend, '')), '')
))
where scores = '{}'::jsonb
  and survey_kind = 'purchase';

create index if not exists sp_survey_responses_kind_created_idx
  on public.sp_survey_responses (survey_kind, created_at desc);

create index if not exists sp_survey_responses_event_key_idx
  on public.sp_survey_responses (event_key)
  where event_key is not null;

comment on table public.sp_survey_responses is
  'One landing table for every OSW survey. Filter by survey_kind (purchase, garden-class, later kinds). Coupon columns stay nullable; class rows never issue a coupon. Open comment lives in notes.';

comment on column public.sp_survey_responses.survey_kind is
  'purchase | garden-class | future activity kinds. Not an enum so a new activity does not need a migration.';

comment on column public.sp_survey_responses.event_key is
  'Optional activity instance, e.g. fall-garden-workshop-2026-08-22. Null for purchase/yard replies.';

comment on column public.sp_survey_responses.scores is
  'Closed-ended answers for this kind. Class: saturdayFeel, heatCall, teaching, comeAgain. Purchase: wouldComeBack, wouldSendFriend.';

comment on column public.sp_survey_responses.notes is
  'Open comment for every kind. Class survey comment and purchase visit writeup both land here.';

create or replace view public.sp_survey_kind_counts
with (security_invoker = true) as
select survey_kind, count(*)::integer as response_count
from public.sp_survey_responses
group by survey_kind;

create or replace view public.sp_survey_all
with (security_invoker = true) as
select
  id,
  created_at,
  survey_kind,
  event_key,
  source,
  first_name,
  email,
  email_normalized,
  phone,
  customer_id,
  would_come_back,
  notes,
  scores,
  user_agent,
  coupon_code
from public.sp_survey_responses;

create or replace view public.sp_survey_garden_class
with (security_invoker = true) as
select * from public.sp_survey_all
where survey_kind = 'garden-class';

create or replace view public.sp_survey_purchase
with (security_invoker = true) as
select * from public.sp_survey_all
where survey_kind = 'purchase';

revoke all on table public.sp_survey_kind_counts from anon, authenticated, public;
revoke all on table public.sp_survey_all from anon, authenticated, public;
revoke all on table public.sp_survey_garden_class from anon, authenticated, public;
revoke all on table public.sp_survey_purchase from anon, authenticated, public;

grant select on table public.sp_survey_kind_counts to service_role;
grant select on table public.sp_survey_all to service_role;
grant select on table public.sp_survey_garden_class to service_role;
grant select on table public.sp_survey_purchase to service_role;
