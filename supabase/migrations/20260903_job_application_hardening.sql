begin;

revoke all on public.job_applications from anon, authenticated;
drop policy if exists "Public can submit sales applications" on public.job_applications;

drop policy if exists "Public can upload job application resumes" on storage.objects;

commit;
