-- Unique one-time 30% Phoenix yard coupon earned on the first successful
-- /survey submit per email. Repeat CSAT rows stay allowed; extra 30% codes do not.

alter table public.sp_survey_responses
  add column if not exists coupon_code text,
  add column if not exists coupon_issued_at timestamptz,
  add column if not exists coupon_expires_at timestamptz,
  add column if not exists coupon_redeemed_at timestamptz;

create unique index if not exists sp_survey_responses_coupon_code_idx
  on public.sp_survey_responses (coupon_code)
  where coupon_code is not null;

create unique index if not exists sp_survey_responses_one_coupon_per_email_idx
  on public.sp_survey_responses (email_normalized)
  where coupon_code is not null;

create index if not exists sp_survey_responses_unredeemed_coupon_idx
  on public.sp_survey_responses (coupon_expires_at)
  where coupon_code is not null and coupon_redeemed_at is null;

alter table public.sp_survey_responses enable row level security;

revoke all on table public.sp_survey_responses from anon, authenticated, public;
grant select, insert, update on table public.sp_survey_responses to service_role;

comment on column public.sp_survey_responses.coupon_code is
  'Unique one-time 30% off one item Phoenix yard coupon. Issued only on the first successful survey submit per email. Null on later survey rows.';

comment on column public.sp_survey_responses.coupon_issued_at is
  'When the unique yard coupon was earned. Validity is 30 days from this timestamp.';

comment on column public.sp_survey_responses.coupon_expires_at is
  'Yard coupon valid until this timestamp (30 days from issue).';

comment on column public.sp_survey_responses.coupon_redeemed_at is
  'Set when staff honor the coupon at the Phoenix yard. Null means unused.';

create or replace function public.redeem_survey_coupon(
  p_coupon_code text,
  p_note text default null
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.sp_survey_responses%rowtype;
  v_now timestamptz := now();
  v_code text := upper(trim(p_coupon_code));
begin
  if v_code is null or v_code = '' then
    return jsonb_build_object('status', 'invalid');
  end if;

  update public.sp_survey_responses
  set coupon_redeemed_at = v_now
  where coupon_code = v_code
    and coupon_redeemed_at is null
    and coupon_expires_at is not null
    and coupon_expires_at >= v_now
  returning * into v_row;

  if found then
    return jsonb_build_object(
      'status', 'redeemed',
      'response_id', v_row.id,
      'coupon_code', v_row.coupon_code,
      'redeemed_at', v_row.coupon_redeemed_at,
      'note', nullif(trim(p_note), '')
    );
  end if;

  select * into v_row
  from public.sp_survey_responses
  where coupon_code = v_code;

  if not found then
    return jsonb_build_object('status', 'invalid');
  end if;
  if v_row.coupon_redeemed_at is not null then
    return jsonb_build_object('status', 'already_redeemed', 'redeemed_at', v_row.coupon_redeemed_at);
  end if;
  if v_row.coupon_expires_at is not null and v_row.coupon_expires_at < v_now then
    return jsonb_build_object('status', 'expired', 'expires_at', v_row.coupon_expires_at);
  end if;
  return jsonb_build_object('status', 'unavailable');
end;
$$;

revoke all on function public.redeem_survey_coupon(text, text) from public;
grant execute on function public.redeem_survey_coupon(text, text) to service_role;
