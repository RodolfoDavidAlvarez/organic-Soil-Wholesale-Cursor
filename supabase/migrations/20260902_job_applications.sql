begin;

create table if not exists public.job_applications (
  id uuid primary key,
  position_slug text not null,
  position_title text not null,
  first_name text not null,
  last_name text not null,
  preferred_name text,
  email text not null,
  phone text not null,
  city text not null,
  state text not null,
  linkedin_url text,
  employment_interest text not null,
  phoenix_availability text not null,
  reliable_transportation text,
  work_authorization text not null,
  earliest_start_date date,
  compensation_expectation text,
  sales_experience_years text not null,
  sales_background text not null,
  experience_tags text[] not null default '{}',
  gardening_experience_years text,
  gardening_focus text[] not null default '{}',
  plants_grown text,
  organic_practices text,
  product_experience text not null,
  why_ssw text not null,
  soil_knowledge text not null,
  computer_proficiency text,
  computer_skills text[] not null default '{}',
  software_tools text,
  computer_task_example text,
  sales_example text not null,
  referral_source text,
  resume_bucket text not null,
  resume_path text not null,
  additional_document_paths text[] not null default '{}',
  source text not null,
  consent_to_contact boolean not null default false,
  application_version smallint not null default 2,
  status text not null default 'new',
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint job_applications_position_check check (position_slug = 'sales-representative'),
  constraint job_applications_resume_bucket_check check (resume_bucket = 'job-applications'),
  constraint job_applications_consent_check check (consent_to_contact = true),
  constraint job_applications_status_check check (status in ('new', 'reviewing', 'phone-screen', 'interview', 'offer', 'hired', 'not-selected', 'withdrawn')),
  constraint job_applications_email_length check (char_length(email) between 3 and 254),
  constraint job_applications_phone_length check (char_length(phone) between 7 and 40),
  constraint job_applications_name_length check (char_length(first_name) between 1 and 80 and char_length(last_name) between 1 and 80),
  constraint job_applications_answers_length check (
    char_length(sales_background) between 40 and 1500
    and char_length(product_experience) between 40 and 1500
    and char_length(why_ssw) between 40 and 1500
    and char_length(soil_knowledge) between 40 and 1500
    and char_length(sales_example) between 40 and 1500
  )
);

alter table public.job_applications
  add column if not exists preferred_name text,
  add column if not exists reliable_transportation text,
  add column if not exists gardening_experience_years text,
  add column if not exists gardening_focus text[] not null default '{}',
  add column if not exists plants_grown text,
  add column if not exists organic_practices text,
  add column if not exists computer_proficiency text,
  add column if not exists computer_skills text[] not null default '{}',
  add column if not exists software_tools text,
  add column if not exists computer_task_example text,
  add column if not exists additional_document_paths text[] not null default '{}',
  add column if not exists application_version smallint not null default 2;

alter table public.job_applications drop constraint if exists job_applications_source_check;
alter table public.job_applications add constraint job_applications_source_check check (
  source in (
    'soilseedandwater.com/careers/sales',
    'www.organicsoilwholesale.com/careers/sales'
  )
);

alter table public.job_applications drop constraint if exists job_applications_version_check;
alter table public.job_applications add constraint job_applications_version_check check (
  application_version in (1, 2)
);

alter table public.job_applications drop constraint if exists job_applications_extended_answers_check;
alter table public.job_applications add constraint job_applications_extended_answers_check check (
  application_version < 2
  or (
    reliable_transportation is not null
    and gardening_experience_years is not null
    and cardinality(gardening_focus) >= 1
    and char_length(plants_grown) between 20 and 1200
    and char_length(organic_practices) between 20 and 1500
    and computer_proficiency is not null
    and cardinality(computer_skills) >= 1
    and char_length(software_tools) between 10 and 1200
    and char_length(computer_task_example) between 40 and 1500
  )
);

create index if not exists job_applications_created_at_idx on public.job_applications (created_at desc);
create index if not exists job_applications_status_idx on public.job_applications (status, created_at desc);

alter table public.job_applications enable row level security;

revoke all on public.job_applications from anon, authenticated;
grant insert (
  id,
  position_slug,
  position_title,
  first_name,
  last_name,
  preferred_name,
  email,
  phone,
  city,
  state,
  linkedin_url,
  employment_interest,
  phoenix_availability,
  reliable_transportation,
  work_authorization,
  earliest_start_date,
  compensation_expectation,
  sales_experience_years,
  sales_background,
  experience_tags,
  gardening_experience_years,
  gardening_focus,
  plants_grown,
  organic_practices,
  product_experience,
  why_ssw,
  soil_knowledge,
  computer_proficiency,
  computer_skills,
  software_tools,
  computer_task_example,
  sales_example,
  referral_source,
  resume_bucket,
  resume_path,
  additional_document_paths,
  source,
  consent_to_contact,
  application_version
) on public.job_applications to anon, authenticated;

drop policy if exists "Public can submit sales applications" on public.job_applications;
create policy "Public can submit sales applications"
  on public.job_applications
  for insert
  to anon, authenticated
  with check (
    position_slug = 'sales-representative'
    and position_title = 'Sales Representative'
    and source in (
      'soilseedandwater.com/careers/sales',
      'www.organicsoilwholesale.com/careers/sales'
    )
    and resume_bucket = 'job-applications'
    and consent_to_contact = true
    and application_version = 2
    and reliable_transportation is not null
    and gardening_experience_years is not null
    and cardinality(gardening_focus) >= 1
    and computer_proficiency is not null
    and cardinality(computer_skills) >= 1
    and status = 'new'
    and internal_notes is null
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'job-applications',
  'job-applications',
  false,
  8388608,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ]
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can upload job application resumes" on storage.objects;
create policy "Public can upload job application resumes"
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'job-applications'
    and (storage.foldername(name))[1] = 'sales-representative'
    and (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  );

commit;
