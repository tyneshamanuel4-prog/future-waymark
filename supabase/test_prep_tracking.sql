create table if not exists public.test_plans (
  user_id uuid not null references auth.users(id) on delete cascade,
  exam text not null check (exam in ('SAT','ACT')),
  planned_test_date date,
  target_score integer,
  strongest_subject text not null default '',
  weakest_subject text not null default '',
  colleges_requiring_scores text[] not null default '{}',
  updated_at timestamptz not null default now(),
  primary key (user_id, exam),
  check (target_score is null or target_score between 1 and 1600)
);

create table if not exists public.practice_test_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  exam text not null check (exam in ('SAT','ACT')),
  practice_date date not null default current_date,
  total_score integer not null check (total_score between 1 and 1600),
  math_score integer,
  reading_writing_score integer,
  english_score integer,
  reading_score integer,
  science_score integer,
  notes text not null default '' check (char_length(notes) <= 1200),
  created_at timestamptz not null default now()
);

create index if not exists practice_test_logs_user_exam_date_idx
  on public.practice_test_logs (user_id, exam, practice_date desc);

alter table public.test_plans enable row level security;
alter table public.practice_test_logs enable row level security;
revoke all on public.test_plans, public.practice_test_logs from anon;
grant select, insert, update, delete on public.test_plans, public.practice_test_logs to authenticated;

create policy "Students read own test plans" on public.test_plans for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students create own test plans" on public.test_plans for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Students update own test plans" on public.test_plans for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Students delete own test plans" on public.test_plans for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Students read own practice logs" on public.practice_test_logs for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students create own practice logs" on public.practice_test_logs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Students update own practice logs" on public.practice_test_logs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Students delete own practice logs" on public.practice_test_logs for delete to authenticated using ((select auth.uid()) = user_id);

