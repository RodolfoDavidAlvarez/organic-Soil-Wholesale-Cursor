-- Memorable public customer number. Random SSW-XXXX, not a sequential id.
-- Alphabet omits 0/1/I/O/L so staff can say it over the phone.

alter table public.sp_customers
  add column if not exists ssw_number text;

alter table public.sp_customers
  drop constraint if exists sp_customers_ssw_number_chk;
alter table public.sp_customers
  add constraint sp_customers_ssw_number_chk
  check (ssw_number is null or ssw_number ~ '^SSW-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$');

create unique index if not exists sp_customers_ssw_number_uidx
  on public.sp_customers (ssw_number)
  where ssw_number is not null;

comment on column public.sp_customers.ssw_number is
  'Public easy-to-say customer number, format SSW-XXXX. Assigned once per customer and reused on later signups. Does not encode customer count or sequential id.';

alter table public.sp_worm_castings_redemptions
  add column if not exists signup_notes text;

comment on column public.sp_worm_castings_redemptions.signup_notes is
  'Optional short note from the /free-worm-castings signup. Not a required routing field.';
