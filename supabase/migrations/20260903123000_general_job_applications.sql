begin;

alter table public.job_applications
  add column if not exists preferred_work_areas text[] not null default '{}',
  add column if not exists education_level text,
  add column if not exists education_field text,
  add column if not exists licenses_certifications text[] not null default '{}',
  add column if not exists equipment_skills text[] not null default '{}',
  add column if not exists physical_work_readiness text;

alter table public.job_applications drop constraint if exists job_applications_position_check;
alter table public.job_applications add constraint job_applications_position_check check (
  (position_slug = 'sales-representative' and position_title = 'Sales Representative')
  or (position_slug = 'general-application' and position_title = 'General Application')
);

alter table public.job_applications drop constraint if exists job_applications_source_check;
alter table public.job_applications add constraint job_applications_source_check check (
  (position_slug = 'sales-representative' and source in (
    'soilseedandwater.com/careers/sales',
    'www.organicsoilwholesale.com/careers/sales'
  ))
  or (position_slug = 'general-application' and source = 'www.organicsoilwholesale.com/careers/general')
);

alter table public.job_applications drop constraint if exists job_applications_version_check;
alter table public.job_applications add constraint job_applications_version_check check (
  application_version in (1, 2, 3)
);

alter table public.job_applications drop constraint if exists job_applications_general_profile_check;
alter table public.job_applications add constraint job_applications_general_profile_check check (
  position_slug <> 'general-application'
  or (
    application_version = 3
    and cardinality(preferred_work_areas) >= 1
    and education_level is not null
    and cardinality(equipment_skills) >= 1
    and physical_work_readiness is not null
  )
);

create index if not exists job_applications_position_created_at_idx
  on public.job_applications (position_slug, created_at desc);

commit;
