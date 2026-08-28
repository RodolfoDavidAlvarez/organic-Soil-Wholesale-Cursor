-- Already applied live as survey_experience_score_1_to_10 (version 20260828165932).
-- Yard /survey sliders are 1-10. The original CHECK was 1-5 and HTTP 500'd scores 6-10.
-- Safe to re-run: drop then re-add the same 1-10 constraint.

alter table public.sp_survey_responses
  drop constraint if exists sp_survey_responses_experience_score_check;

alter table public.sp_survey_responses
  add constraint sp_survey_responses_experience_score_check
  check (experience_score is null or (experience_score >= 1 and experience_score <= 10));
