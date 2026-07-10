-- Route 'poke' events to the target's feed only (a private nudge, not a
-- broadcast). Every other type keeps the self + friends fan-out from 0011.
-- Uses ::text comparison so the function body doesn't resolve enum literals.
create or replace function public.fanout_activity_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type::text = 'poke' then
    insert into public.feed_entries (recipient_id, event_id)
    values ((new.payload->>'target_user_id')::uuid, new.id);
    return new;
  end if;

  insert into public.feed_entries (recipient_id, event_id)
  values (new.user_id, new.id);
  if new.visible_to_friends then
    insert into public.feed_entries (recipient_id, event_id)
    select case when f.user_a = new.user_id then f.user_b else f.user_a end, new.id
    from public.friendships f
    where f.user_a = new.user_id or f.user_b = new.user_id;
  end if;
  return new;
end;
$$;
