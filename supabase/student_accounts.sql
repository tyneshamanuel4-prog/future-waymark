create table if not exists public.student_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '', last_name text not null default '',
  grade_level text not null default '12',
  graduation_year integer not null default extract(year from now())::integer,
  pathway text not null default 'Still exploring', interests text[] not null default '{}',
  goals text[] not null default '{}', target_schools text[] not null default '{}',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.student_steps (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180), category text not null default 'My goal',
  due_date date, completed boolean not null default false, position integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.saved_resources (
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id bigint not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default now(), primary key (user_id, resource_id)
);
alter table public.student_profiles enable row level security;
alter table public.student_steps enable row level security;
alter table public.saved_resources enable row level security;
revoke all on public.student_profiles, public.student_steps, public.saved_resources from anon;
grant select, insert, update, delete on public.student_profiles, public.student_steps, public.saved_resources to authenticated;
create policy "Students read own profile" on public.student_profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Students create own profile" on public.student_profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Students update own profile" on public.student_profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "Students delete own profile" on public.student_profiles for delete to authenticated using ((select auth.uid()) = id);
create policy "Students read own steps" on public.student_steps for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students create own steps" on public.student_steps for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Students update own steps" on public.student_steps for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Students delete own steps" on public.student_steps for delete to authenticated using ((select auth.uid()) = user_id);
create policy "Students read own saved resources" on public.saved_resources for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students save resources for themselves" on public.saved_resources for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Students remove own saved resources" on public.saved_resources for delete to authenticated using ((select auth.uid()) = user_id);
