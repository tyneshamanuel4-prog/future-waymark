create table if not exists public.student_document_checklist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null check (char_length(document_type) between 1 and 100),
  ready boolean not null default false,
  notes text not null default '' check (char_length(notes) <= 500),
  updated_at timestamptz not null default now(),
  unique (user_id, document_type)
);

create table if not exists public.student_notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  browser_notifications boolean not null default false,
  reminder_days integer[] not null default '{1,3,7}',
  updated_at timestamptz not null default now(),
  check (reminder_days <@ array[0,1,2,3,5,7,14,30])
);

alter table public.student_document_checklist enable row level security;
alter table public.student_notification_preferences enable row level security;
revoke all on public.student_document_checklist, public.student_notification_preferences from anon;
grant select, insert, update, delete on public.student_document_checklist, public.student_notification_preferences to authenticated;
create policy "Students manage own document checklist" on public.student_document_checklist for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Students manage own notification preferences" on public.student_notification_preferences for all to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
