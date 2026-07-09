-- Friend/request cards for the Friends tab. profiles RLS is owner-only, so
-- names/streaks of friends and requesters come through a security-definer
-- function scoped to exactly the relationships the caller is part of.
create function public.friend_cards()
returns table (user_id uuid, handle text, display_name text, avatar_url text, current_streak int, relation text)
language sql
stable
security definer
set search_path = public
as $$
  select p.user_id, p.handle, p.display_name, p.avatar_url,
         coalesce(s.current_streak, 0), rel.relation
  from (
    select case when f.user_a = auth.uid() then f.user_b else f.user_a end as uid,
           'friend'::text as relation
    from friendships f
    where f.user_a = auth.uid() or f.user_b = auth.uid()
    union all
    select r.requester_id, 'incoming' from friend_requests r
    where r.addressee_id = auth.uid() and r.status = 'pending'
    union all
    select r.addressee_id, 'outgoing' from friend_requests r
    where r.requester_id = auth.uid() and r.status = 'pending'
  ) rel
  join profiles p on p.user_id = rel.uid
  left join streaks s on s.user_id = rel.uid
  order by coalesce(s.current_streak, 0) desc;
$$;

grant execute on function public.friend_cards() to authenticated;
