create or replace function public.delete_own_future_waymark_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  requesting_user uuid := auth.uid();
begin
  if requesting_user is null then
    raise exception 'Authentication required';
  end if;
  delete from auth.users where id = requesting_user;
end;
$$;

revoke all on function public.delete_own_future_waymark_account() from public, anon;
grant execute on function public.delete_own_future_waymark_account() to authenticated;
