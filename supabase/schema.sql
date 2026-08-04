-- Future Waymark public resource catalog.
-- The live project has RLS enabled and exposes only published, verified resources.
create table public.resources (
  id bigint generated always as identity primary key,
  slug text not null unique,
  type text not null check (type in ('Guide','Video','Template','Checklist')),
  title text not null,
  category text not null,
  description text not null,
  duration text not null,
  skill_level text not null,
  icon text not null default '•',
  accent text not null default 'sage',
  is_featured boolean not null default false,
  is_published boolean not null default false,
  author text not null default 'Future Waymark',
  tags text[] not null default '{}',
  source_url text,
  published_at timestamptz,
  last_reviewed_at timestamptz,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resources enable row level security;
revoke all on table public.resources from anon, authenticated;
grant select on table public.resources to anon, authenticated;
create policy "Public can read verified resources"
on public.resources for select
to anon, authenticated
using (is_published = true and verification_status = 'verified');

-- Private student profile. Authorization is based only on auth.uid().
create table if not exists public.student_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null default '',
  last_name text not null default '',
  grade_level text not null default '12',
  graduation_year integer not null default extract(year from now())::integer,
  pathway text not null default 'Still exploring',
  interests text[] not null default '{}',
  goals text[] not null default '{}',
  target_schools text[] not null default '{}',
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.student_steps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 180),
  category text not null default 'My goal',
  due_date date,
  reminder_date date,
  notes text not null default '' check (char_length(notes) <= 1200),
  completed boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_resources (
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id bigint not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, resource_id)
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

-- Student reading progress, recently viewed resources, and custom collections
-- are defined in resource_engagement.sql.
-- SAT and ACT plans and practice logs are defined in test_prep_tracking.sql.
-- Private resume versions are defined in resume_builder.sql.
-- Private writing workspaces are defined in essay_writing_center.sql.
-- Private interview plans and STAR practice sessions are defined in interview_preparation.sql.
-- College and scholarship application records are defined in application_scholarship_tracker.sql.
-- Private recommendation request records are defined in recommendation_letters.sql.
