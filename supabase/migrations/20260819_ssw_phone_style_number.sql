-- Public customer number is now phone-style: SSW-###-###.
-- Six random digits, unique, not sequential. First digit is 2-9 so staff
-- never say a number that starts with 0 or 1. Old SSW-XXXX values move to
-- ssw_number_alias so a leftover alphanumeric code still looks up.

alter table public.sp_customers
  add column if not exists ssw_number_alias text;

update public.sp_customers
set ssw_number_alias = ssw_number
where ssw_number is not null
  and ssw_number ~ '^SSW-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{4}$'
  and ssw_number_alias is null;

alter table public.sp_customers
  drop constraint if exists sp_customers_ssw_number_chk;

update public.sp_customers
set ssw_number = null
where ssw_number is not null
  and ssw_number !~ '^SSW-[2-9][0-9]{2}-[0-9]{3}$';

alter table public.sp_customers
  add constraint sp_customers_ssw_number_chk
  check (ssw_number is null or ssw_number ~ '^SSW-[2-9][0-9]{2}-[0-9]{3}$');

create unique index if not exists sp_customers_ssw_number_uidx
  on public.sp_customers (ssw_number)
  where ssw_number is not null;

create unique index if not exists sp_customers_ssw_number_alias_uidx
  on public.sp_customers (ssw_number_alias)
  where ssw_number_alias is not null;

comment on column public.sp_customers.ssw_number is
  'Public easy-to-say customer number, format SSW-###-###. Random unique six digits, first digit 2-9. Assigned once per customer and reused. Does not encode customer count or sequential id.';

comment on column public.sp_customers.ssw_number_alias is
  'Previous public number kept for lookup after a remint. Currently the retired SSW-XXXX alphanumeric codes.';
