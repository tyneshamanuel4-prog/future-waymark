alter table public.student_profiles add column if not exists pathways text[] not null default '{}';
update public.student_profiles set pathways=array[pathway] where cardinality(pathways)=0 and pathway is not null;
