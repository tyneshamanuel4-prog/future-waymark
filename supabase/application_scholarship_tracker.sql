create table if not exists public.college_applications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 college_name text not null check (char_length(college_name) between 1 and 160), application_type text not null default 'Regular Decision' check (application_type in ('Early Action','Early Decision','Regular Decision','Rolling')),
 deadline date, status text not null default 'Researching' check (status in ('Researching','Planning','In Progress','Submitted','Decision Received','Enrolled','Not Pursuing')),
 portal_url text not null default '', application_fee numeric(8,2), fee_waiver boolean not null default false,
 requirements jsonb not null default '{}'::jsonb, notes text not null default '', decision text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.scholarship_applications (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 scholarship_name text not null check (char_length(scholarship_name) between 1 and 180), provider text not null default '', deadline date,
 amount numeric(12,2), status text not null default 'Researching' check (status in ('Researching','Planning','In Progress','Submitted','Awarded','Not Awarded','Not Pursuing')),
 source_url text not null default '', requirements jsonb not null default '{}'::jsonb, notes text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists college_applications_user_deadline_idx on public.college_applications(user_id,deadline);
create index if not exists scholarship_applications_user_deadline_idx on public.scholarship_applications(user_id,deadline);
alter table public.college_applications enable row level security;
alter table public.scholarship_applications enable row level security;
revoke all on public.college_applications from anon;
revoke all on public.scholarship_applications from anon;
grant select,insert,update,delete on public.college_applications to authenticated;
grant select,insert,update,delete on public.scholarship_applications to authenticated;
create policy "Students read own college applications" on public.college_applications for select to authenticated using ((select auth.uid())=user_id);
create policy "Students create own college applications" on public.college_applications for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Students update own college applications" on public.college_applications for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Students delete own college applications" on public.college_applications for delete to authenticated using ((select auth.uid())=user_id);
create policy "Students read own scholarships" on public.scholarship_applications for select to authenticated using ((select auth.uid())=user_id);
create policy "Students create own scholarships" on public.scholarship_applications for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Students update own scholarships" on public.scholarship_applications for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Students delete own scholarships" on public.scholarship_applications for delete to authenticated using ((select auth.uid())=user_id);
