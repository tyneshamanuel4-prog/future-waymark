create table if not exists public.recommendation_requests (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 recommender_name text not null check(char_length(recommender_name) between 1 and 140), recommender_role text not null default '', recommender_email text not null default '',
 destination text not null default '', deadline date, requested_on date, status text not null default 'Planning' check(status in ('Planning','Asked','Accepted','Materials Shared','Submitted','Thanked','Declined')),
 request_method text not null default 'In Person' check(request_method in ('In Person','Email','Application Portal','Other')),
 materials jsonb not null default '{}'::jsonb, submission_method text not null default '', notes text not null default '', thank_you_date date,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists recommendation_requests_user_deadline_idx on public.recommendation_requests(user_id,deadline);
alter table public.recommendation_requests enable row level security;
revoke all on public.recommendation_requests from anon;
grant select,insert,update,delete on public.recommendation_requests to authenticated;
create policy "Students read own recommendation requests" on public.recommendation_requests for select to authenticated using ((select auth.uid())=user_id);
create policy "Students create own recommendation requests" on public.recommendation_requests for insert to authenticated with check ((select auth.uid())=user_id);
create policy "Students update own recommendation requests" on public.recommendation_requests for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "Students delete own recommendation requests" on public.recommendation_requests for delete to authenticated using ((select auth.uid())=user_id);
