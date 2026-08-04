alter table public.college_applications
  drop constraint if exists college_applications_status_check;

alter table public.college_applications
  add constraint college_applications_status_check
  check (status in ('Researching','Planning','In Progress','Submitted','Conditionally Admitted','Decision Received','Enrolled','Not Pursuing'));
