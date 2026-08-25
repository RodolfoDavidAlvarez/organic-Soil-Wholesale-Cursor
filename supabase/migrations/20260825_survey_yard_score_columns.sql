-- Yard survey score / chip columns already live on production sp_survey_responses.
-- Keep them in repo history so new environments match. Safe to re-run.

alter table public.sp_survey_responses
  add column if not exists experience_score smallint,
  add column if not exists worked_well text[] not null default '{}'::text[],
  add column if not exists finding_us text,
  add column if not exists improve_most text;

comment on column public.sp_survey_responses.experience_score is
  'Yard overall visit/order score, 1-10. Null on class rows and older free-text yard replies.';

comment on column public.sp_survey_responses.worked_well is
  'Yard multi-select chips for what worked. Includes Finding the yard / entrance. Empty array when none tapped.';

comment on column public.sp_survey_responses.finding_us is
  'Yard 1-10 score for how easy it was to find us / get here, stored as text. Written by /survey.';

comment on column public.sp_survey_responses.improve_most is
  'Yard single chip for what to improve most. May be Finding the yard / entrance.';
