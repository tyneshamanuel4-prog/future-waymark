create table if not exists public.resource_activity (
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id bigint not null references public.resources(id) on delete cascade,
  progress integer not null default 0 check (progress between 0 and 100),
  completed boolean not null default false,
  last_viewed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, resource_id)
);

create table if not exists public.resource_collections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, name)
);

create table if not exists public.collection_resources (
  collection_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  resource_id bigint not null references public.resources(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (collection_id, resource_id),
  foreign key (collection_id, user_id)
    references public.resource_collections(id, user_id) on delete cascade
);

create index if not exists resource_activity_user_viewed_idx on public.resource_activity (user_id, last_viewed_at desc);
create index if not exists resource_activity_resource_idx on public.resource_activity (resource_id);
create index if not exists resource_collections_user_idx on public.resource_collections (user_id);
create index if not exists collection_resources_user_idx on public.collection_resources (user_id);
create index if not exists collection_resources_collection_user_idx on public.collection_resources (collection_id, user_id);
create index if not exists collection_resources_resource_idx on public.collection_resources (resource_id);
create index if not exists saved_resources_resource_idx on public.saved_resources (resource_id);
create index if not exists student_steps_user_idx on public.student_steps (user_id);

alter table public.resource_activity enable row level security;
alter table public.resource_collections enable row level security;
alter table public.collection_resources enable row level security;

revoke all on public.resource_activity, public.resource_collections, public.collection_resources from anon;
grant select, insert, update, delete on public.resource_activity, public.resource_collections, public.collection_resources to authenticated;

create policy "Students read own resource activity" on public.resource_activity for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students create own resource activity" on public.resource_activity for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Students update own resource activity" on public.resource_activity for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Students delete own resource activity" on public.resource_activity for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Students read own collections" on public.resource_collections for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students create own collections" on public.resource_collections for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Students update own collections" on public.resource_collections for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "Students delete own collections" on public.resource_collections for delete to authenticated using ((select auth.uid()) = user_id);

create policy "Students read own collection resources" on public.collection_resources for select to authenticated using ((select auth.uid()) = user_id);
create policy "Students add own collection resources" on public.collection_resources for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Students remove own collection resources" on public.collection_resources for delete to authenticated using ((select auth.uid()) = user_id);
