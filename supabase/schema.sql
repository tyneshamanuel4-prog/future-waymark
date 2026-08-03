-- Future Waymark public resource catalog.
-- The live project has RLS enabled and exposes only published, verified resources.
create table public.resources (
  id bigint generated always as identity primary key,
  slug text not null unique,
  type text not null check (type in ('Guide','Video','Template','Checklist')),
  title text not null,
  category text not null,
  description text not null,
  duration text not null,
  skill_level text not null,
  icon text not null default '•',
  accent text not null default 'sage',
  is_featured boolean not null default false,
  is_published boolean not null default false,
  author text not null default 'Future Waymark',
  tags text[] not null default '{}',
  source_url text,
  published_at timestamptz,
  last_reviewed_at timestamptz,
  verification_status text not null default 'pending' check (verification_status in ('pending','verified','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resources enable row level security;
revoke all on table public.resources from anon, authenticated;
grant select on table public.resources to anon, authenticated;
create policy "Public can read verified resources"
on public.resources for select
to anon, authenticated
using (is_published = true and verification_status = 'verified');
