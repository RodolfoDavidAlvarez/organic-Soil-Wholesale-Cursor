-- Routing answers for the August /free-worm-castings gift signup.
-- Existing 9-lb Mikey's Worm Poop coupon flow is unchanged: one token per email,
-- Aug 1-31 Phoenix yard pickup. New columns are nullable so prior signups stay valid.

alter table public.sp_worm_castings_redemptions
  add column if not exists zip_code text,
  add column if not exists customer_type text,
  add column if not exists garden_status text,
  add column if not exists growing text[],
  add column if not exists growing_other text,
  add column if not exists property_profile text,
  add column if not exists offer text,
  add column if not exists source text,
  add column if not exists next_action text;

alter table public.sp_worm_castings_redemptions
  drop constraint if exists sp_worm_castings_customer_type_chk;
alter table public.sp_worm_castings_redemptions
  add constraint sp_worm_castings_customer_type_chk
  check (customer_type is null or customer_type in ('homeowner', 'landscaper', 'specialty-farmer'));

alter table public.sp_worm_castings_redemptions
  drop constraint if exists sp_worm_castings_garden_status_chk;
alter table public.sp_worm_castings_redemptions
  add constraint sp_worm_castings_garden_status_chk
  check (garden_status is null or garden_status in ('brand-new', 'existing'));

create index if not exists sp_worm_castings_routing_customer_type_idx
  on public.sp_worm_castings_redemptions (customer_type)
  where customer_type is not null;

create index if not exists sp_worm_castings_routing_zip_idx
  on public.sp_worm_castings_redemptions (zip_code)
  where zip_code is not null;

comment on column public.sp_worm_castings_redemptions.zip_code is
  'US ZIP from the gift signup. CRM field due Aug 25.';
comment on column public.sp_worm_castings_redemptions.customer_type is
  'Who they are: homeowner, landscaper, or specialty-farmer.';
comment on column public.sp_worm_castings_redemptions.garden_status is
  'Intro discovery: brand-new or existing garden.';
comment on column public.sp_worm_castings_redemptions.growing is
  'Mike plant list: food-garden, turf, ornamentals, trees, citrus-avocado, palms, roses, succulents, indoor-plants.';
comment on column public.sp_worm_castings_redemptions.growing_other is
  'Optional short text when the garden does not fit the Mike list.';
comment on column public.sp_worm_castings_redemptions.property_profile is
  'Human-readable property profile for CRM (growing labels plus optional Other).';
comment on column public.sp_worm_castings_redemptions.offer is
  'Offer key. August gift is free-9lb-mikeys-worm-poop.';
comment on column public.sp_worm_castings_redemptions.source is
  'Signup source already used for campaign tracking (print, social, ads, etc.).';
comment on column public.sp_worm_castings_redemptions.next_action is
  'Derived follow-up: yard pickup plus intro prescription or existing-garden upsell.';
