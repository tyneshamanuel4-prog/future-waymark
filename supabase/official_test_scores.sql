alter table public.practice_test_logs add column if not exists score_type text not null default 'Practice' check(score_type in ('Practice','Official'));
