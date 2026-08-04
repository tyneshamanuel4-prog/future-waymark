alter table public.student_steps
  add column if not exists reminder_date date,
  add column if not exists notes text not null default '';

alter table public.student_steps
  drop constraint if exists student_steps_notes_length;

alter table public.student_steps
  add constraint student_steps_notes_length check (char_length(notes) <= 1200);

create index if not exists student_steps_user_due_idx
  on public.student_steps (user_id, due_date)
  where completed = false and due_date is not null;

