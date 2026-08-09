create table if not exists public.student_college_decisions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  school_name text not null check (char_length(school_name) between 1 and 160),
  academics smallint not null default 3 check (academics between 1 and 5),
  affordability smallint not null default 3 check (affordability between 1 and 5),
  campus_life smallint not null default 3 check (campus_life between 1 and 5),
  location_fit smallint not null default 3 check (location_fit between 1 and 5),
  career_fit smallint not null default 3 check (career_fit between 1 and 5),
  notes text not null default '' check (char_length(notes) <= 5000),
  updated_at timestamptz not null default now(), unique(user_id, school_name)
);
alter table public.student_college_decisions enable row level security;
revoke all on public.student_college_decisions from anon;
grant select, insert, update, delete on public.student_college_decisions to authenticated;
create policy "Students manage own college decisions" on public.student_college_decisions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
