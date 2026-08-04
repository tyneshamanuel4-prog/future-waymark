create table if not exists public.essay_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  essay_type text not null check (essay_type in ('College Essay','Scholarship Essay','Personal Statement','Supplemental Essay')),
  prompt text not null default '',
  planning_template text not null default 'Essay Outline'
    check (planning_template in ('Essay Outline','Brainstorm Worksheet','Story Map','Personal Timeline','Topic Organizer')),
  brainstorm text not null default '',
  outline text not null default '',
  content text not null default '',
  word_limit integer check (word_limit is null or word_limit between 1 and 5000),
  stage text not null default 'Planning' check (stage in ('Planning','Drafting','Revising','Proofreading','Complete')),
  checklist jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists essay_drafts_user_updated_idx
  on public.essay_drafts (user_id, updated_at desc);

alter table public.essay_drafts enable row level security;
revoke all on public.essay_drafts from anon;
grant select, insert, update, delete on public.essay_drafts to authenticated;

create policy "Students read own essays" on public.essay_drafts for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students create own essays" on public.essay_drafts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Students update own essays" on public.essay_drafts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Students delete own essays" on public.essay_drafts for delete to authenticated using ((select auth.uid()) = user_id);

