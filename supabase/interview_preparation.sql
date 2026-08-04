create table if not exists public.interview_preparations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  interview_type text not null check (interview_type in ('Scholarship','College Admissions','Job','Internship')),
  organization text not null default '',
  interview_date timestamptz,
  format text not null default 'In Person' check (format in ('In Person','Virtual','Phone')),
  interviewer text not null default '',
  questions_to_ask text not null default '',
  notes text not null default '',
  follow_up_date date,
  checklist jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists public.interview_practice_sessions (
  id uuid primary key default gen_random_uuid(),
  preparation_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  practiced_at date not null default current_date,
  question text not null check (char_length(question) between 1 and 500),
  situation text not null default '',
  task text not null default '',
  action text not null default '',
  result text not null default '',
  reflection text not null default '',
  confidence integer not null default 3 check (confidence between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (preparation_id, user_id) references public.interview_preparations(id, user_id) on delete cascade
);

create index if not exists interview_preparations_user_date_idx on public.interview_preparations(user_id, interview_date);
create index if not exists interview_practice_sessions_user_prep_idx on public.interview_practice_sessions(user_id, preparation_id);

alter table public.interview_preparations enable row level security;
alter table public.interview_practice_sessions enable row level security;

revoke all on public.interview_preparations from anon;
revoke all on public.interview_practice_sessions from anon;
grant select, insert, update, delete on public.interview_preparations to authenticated;
grant select, insert, update, delete on public.interview_practice_sessions to authenticated;

create policy "Students read own interview plans" on public.interview_preparations for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students create own interview plans" on public.interview_preparations for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Students update own interview plans" on public.interview_preparations for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Students delete own interview plans" on public.interview_preparations for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Students read own interview practice" on public.interview_practice_sessions for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students create own interview practice" on public.interview_practice_sessions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Students update own interview practice" on public.interview_practice_sessions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Students delete own interview practice" on public.interview_practice_sessions for delete to authenticated using ((select auth.uid()) = user_id);
