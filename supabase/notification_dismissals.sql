create table if not exists public.student_notification_dismissals (
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_key text not null check (char_length(notification_key) between 1 and 200),
  dismissed_at timestamptz not null default now(),
  primary key (user_id, notification_key)
);

alter table public.student_notification_dismissals enable row level security;
revoke all on public.student_notification_dismissals from anon;
grant select, insert, update, delete on public.student_notification_dismissals to authenticated;
create policy "Students manage own notification dismissals"
  on public.student_notification_dismissals for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
