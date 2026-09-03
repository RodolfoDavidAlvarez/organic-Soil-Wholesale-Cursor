begin;

alter table public.job_applications
  add column if not exists applicant_confirmation_status text not null default 'pending',
  add column if not exists applicant_confirmation_provider_id text,
  add column if not exists applicant_confirmation_sent_at timestamptz,
  add column if not exists admin_notification_status text not null default 'pending',
  add column if not exists admin_notification_provider_ids jsonb not null default '{}'::jsonb,
  add column if not exists admin_notification_sent_at timestamptz,
  add column if not exists notification_document_links jsonb not null default '[]'::jsonb,
  add column if not exists notification_last_error text;

alter table public.job_applications drop constraint if exists job_applications_applicant_confirmation_status_check;
alter table public.job_applications add constraint job_applications_applicant_confirmation_status_check
  check (applicant_confirmation_status in ('pending', 'sent', 'failed'));

alter table public.job_applications drop constraint if exists job_applications_admin_notification_status_check;
alter table public.job_applications add constraint job_applications_admin_notification_status_check
  check (admin_notification_status in ('pending', 'sent', 'partial', 'failed'));

commit;
