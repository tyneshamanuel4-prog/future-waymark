create table if not exists public.student_weekly_focus (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null, goal text not null check (char_length(goal) between 1 and 240), completed boolean not null default false,
  reflection text not null default '' check (char_length(reflection) <= 1000), updated_at timestamptz not null default now(), unique(user_id,week_start)
);
create table if not exists public.student_feedback (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  category text not null check(category in ('Bug','Confusing','Suggestion','Missing Information','Other')),
  message text not null check(char_length(message) between 5 and 3000), page_section text not null default '', status text not null default 'New', created_at timestamptz not null default now()
);
alter table public.student_weekly_focus enable row level security; alter table public.student_feedback enable row level security;
revoke all on public.student_weekly_focus,public.student_feedback from anon;
grant select,insert,update,delete on public.student_weekly_focus,public.student_feedback to authenticated;
create policy "Students manage own weekly focus" on public.student_weekly_focus for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Students manage own feedback" on public.student_feedback for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
