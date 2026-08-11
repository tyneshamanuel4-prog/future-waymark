alter table public.resources
  add column if not exists provider text,
  add column if not exists embed_url text,
  add column if not exists captions_available boolean not null default false,
  add column if not exists transcript_url text,
  add column if not exists last_verified_at timestamptz,
  add column if not exists chapters jsonb not null default '[]'::jsonb;

insert into public.resources
  (slug,type,title,category,description,duration,skill_level,icon,accent,is_featured,is_published,author,tags,source_url,published_at,last_reviewed_at,verification_status,provider,embed_url,captions_available,transcript_url,last_verified_at,chapters)
values
  ('fafsa-overview-official','Video','FAFSA Overview','FAFSA & Financial Aid','Learn what the FAFSA form does, when to complete it, basic eligibility, and what information students and families should gather securely.','2 min','Start here','▶','gold',true,true,'Federal Student Aid',array['FAFSA','financial aid','official'],'https://www.youtube.com/watch?v=emUDDQSFYRI','2022-02-02T00:00:00Z',now(),'verified','Federal Student Aid','https://www.youtube-nocookie.com/embed/emUDDQSFYRI',true,'https://www.youtube.com/watch?v=emUDDQSFYRI',now(),'[{"time":"0:00","title":"Overview"},{"time":"0:19","title":"Types of aid"},{"time":"0:29","title":"When to apply"},{"time":"0:43","title":"Eligibility"},{"time":"1:12","title":"What you need"},{"time":"1:45","title":"Deadlines"}]'::jsonb),
  ('financial-aid-process-official','Video','Overview of the Financial Aid Process','FAFSA & Financial Aid','Understand the major types of federal student aid and the general steps students take when seeking help paying for college or career school.','3 min','Beginner','▶','sage',false,true,'Federal Student Aid',array['financial aid','grants','loans','work-study','official'],'https://www.youtube.com/watch?v=H_iS7gmQd9o','2016-09-30T00:00:00Z',now(),'verified','Federal Student Aid','https://www.youtube-nocookie.com/embed/H_iS7gmQd9o',true,'https://www.youtube.com/watch?v=H_iS7gmQd9o',now(),'[]'::jsonb)
on conflict (slug) do update set
  title=excluded.title, category=excluded.category, description=excluded.description,
  duration=excluded.duration, skill_level=excluded.skill_level, tags=excluded.tags,
  source_url=excluded.source_url, is_published=true, verification_status='verified',
  provider=excluded.provider, embed_url=excluded.embed_url,
  captions_available=excluded.captions_available, transcript_url=excluded.transcript_url,
  last_verified_at=excluded.last_verified_at, chapters=excluded.chapters, updated_at=now();
