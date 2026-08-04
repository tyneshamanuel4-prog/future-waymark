create table if not exists public.school_research_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  school_name text not null check (char_length(school_name) between 1 and 160),
  application_deadline date,
  financial_aid_deadline date,
  notes text not null default '' check (char_length(notes) <= 3000),
  last_verified_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, school_name)
);

create table if not exists public.school_comparisons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  schools text[] not null check (cardinality(schools) between 1 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists school_research_notes_user_idx on public.school_research_notes (user_id);
create index if not exists school_comparisons_user_idx on public.school_comparisons (user_id, updated_at desc);
alter table public.school_research_notes enable row level security;
alter table public.school_comparisons enable row level security;
revoke all on public.school_research_notes, public.school_comparisons from anon;
grant select, insert, update, delete on public.school_research_notes, public.school_comparisons to authenticated;
create policy "Students read own school notes" on public.school_research_notes for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students create own school notes" on public.school_research_notes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Students update own school notes" on public.school_research_notes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Students delete own school notes" on public.school_research_notes for delete to authenticated using ((select auth.uid()) = user_id);
create policy "Students read own comparisons" on public.school_comparisons for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students create own comparisons" on public.school_comparisons for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Students update own comparisons" on public.school_comparisons for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Students delete own comparisons" on public.school_comparisons for delete to authenticated using ((select auth.uid()) = user_id);
