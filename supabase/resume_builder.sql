create table if not exists public.resume_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 80),
  template text not null default 'classic' check (template in ('classic','modern')),
  contact_info jsonb not null default '{}'::jsonb,
  sections jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resume_versions_user_updated_idx
  on public.resume_versions (user_id, updated_at desc);

alter table public.resume_versions enable row level security;
revoke all on public.resume_versions from anon;
grant select, insert, update, delete on public.resume_versions to authenticated;

create policy "Students read own resumes" on public.resume_versions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students create own resumes" on public.resume_versions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Students update own resumes" on public.resume_versions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Students delete own resumes" on public.resume_versions for delete to authenticated using ((select auth.uid()) = user_id);

