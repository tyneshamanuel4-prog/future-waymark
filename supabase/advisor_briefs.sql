create table if not exists public.student_advisor_briefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  meeting_date date,
  questions text not null default '' check (char_length(questions) <= 5000),
  meeting_notes text not null default '' check (char_length(meeting_notes) <= 10000),
  updated_at timestamptz not null default now()
);
alter table public.student_advisor_briefs enable row level security;
revoke all on public.student_advisor_briefs from anon;
grant select, insert, update, delete on public.student_advisor_briefs to authenticated;
create policy "Students manage own advisor briefs" on public.student_advisor_briefs
  for all to authenticated using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
