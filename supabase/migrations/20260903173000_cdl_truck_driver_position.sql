begin;

alter table public.job_applications
  add column if not exists congress_availability text,
  add column if not exists commercial_driving_years text,
  add column if not exists cdl_class text,
  add column if not exists cdl_endorsements text[] not null default '{}',
  add column if not exists dot_medical_card text,
  add column if not exists insurer_eligibility text,
  add column if not exists manual_transmission_experience text,
  add column if not exists driver_technology_skills text[] not null default '{}',
  add column if not exists commercial_driving_background text,
  add column if not exists bulk_material_experience text,
  add column if not exists safety_example text,
  add column if not exists customer_delivery_example text;

alter table public.job_applications
  alter column phoenix_availability drop not null,
  alter column sales_experience_years drop not null,
  alter column sales_background drop not null,
  alter column product_experience drop not null,
  alter column soil_knowledge drop not null,
  alter column sales_example drop not null;

alter table public.job_applications drop constraint if exists job_applications_position_check;
alter table public.job_applications add constraint job_applications_position_check check (
  (position_slug = 'sales-representative' and position_title = 'Sales Representative')
  or (position_slug = 'general-application' and position_title = 'General Application')
  or (position_slug = 'cdl-truck-driver' and position_title = 'CDL Truck Driver')
);

alter table public.job_applications drop constraint if exists job_applications_source_check;
alter table public.job_applications add constraint job_applications_source_check check (
  (position_slug = 'sales-representative' and source in (
    'soilseedandwater.com/careers/sales',
    'www.organicsoilwholesale.com/careers/sales'
  ))
  or (position_slug = 'general-application' and source = 'www.organicsoilwholesale.com/careers/general')
  or (position_slug = 'cdl-truck-driver' and source = 'www.organicsoilwholesale.com/careers/truck-driver')
);

alter table public.job_applications drop constraint if exists job_applications_version_check;
alter table public.job_applications add constraint job_applications_version_check check (
  application_version in (1, 2, 3, 4)
);

alter table public.job_applications drop constraint if exists job_applications_answers_length;
alter table public.job_applications add constraint job_applications_answers_length check (
  char_length(why_ssw) between 40 and 1500
  and (
    (
      position_slug = 'cdl-truck-driver'
      and char_length(commercial_driving_background) between 40 and 1500
      and char_length(bulk_material_experience) between 40 and 1500
      and char_length(safety_example) between 40 and 1500
      and char_length(customer_delivery_example) between 40 and 1500
    )
    or (
      position_slug <> 'cdl-truck-driver'
      and char_length(sales_background) between 40 and 1500
      and char_length(product_experience) between 40 and 1500
      and char_length(soil_knowledge) between 40 and 1500
      and char_length(sales_example) between 40 and 1500
    )
  )
);

alter table public.job_applications drop constraint if exists job_applications_extended_answers_check;
alter table public.job_applications add constraint job_applications_extended_answers_check check (
  application_version < 2
  or position_slug = 'cdl-truck-driver'
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

alter table public.job_applications drop constraint if exists job_applications_driver_profile_check;
alter table public.job_applications add constraint job_applications_driver_profile_check check (
  position_slug <> 'cdl-truck-driver'
  or (
    application_version = 4
    and congress_availability is not null
    and reliable_transportation is not null
    and commercial_driving_years is not null
    and cdl_class is not null
    and dot_medical_card is not null
    and insurer_eligibility is not null
    and manual_transmission_experience is not null
    and cardinality(equipment_skills) >= 1
    and physical_work_readiness is not null
    and computer_proficiency is not null
    and cardinality(driver_technology_skills) >= 1
    and char_length(software_tools) between 10 and 1200
    and char_length(computer_task_example) between 40 and 1500
  )
);

commit;
