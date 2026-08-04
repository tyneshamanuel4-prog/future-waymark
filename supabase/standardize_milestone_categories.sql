update public.student_steps set category=case
 when title ~* 'FAFSA|financial aid' then 'FAFSA & Financial Aid'
 when title ~* 'scholarship' then 'Scholarships'
 when title ~* 'SAT|ACT|test score|test prep' then 'SAT & ACT'
 when title ~* 'essay|personal statement' then 'Essay Writing'
 when title ~* 'recommend' then 'Recommendation Letters'
 when title ~* 'resume' then 'Resume Building'
 when title ~* 'interview' then 'Interview Preparation'
 when title ~* 'campus|college visit' then 'College Visits'
 when title ~* 'study|time management|note-taking' then 'Study Skills'
 when title ~* 'college list|college application|apply for admission' then 'College Applications'
 else 'Path Planning' end;
