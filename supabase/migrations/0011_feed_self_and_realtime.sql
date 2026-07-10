-- 1) Fan activity events out to the actor too, so your own activity shows
--    in your feed ("You finished ..." perspective, FD §11). Self rows are
--    written even when visibility is private — you can always see yourself.
create or replace function public.fanout_activity_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
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

-- Backfill self rows for events that predate this change.
insert into public.feed_entries (recipient_id, event_id)
select e.user_id, e.id from public.activity_events e
on conflict do nothing;

-- 2) Realtime (docs/TD.md § Realtime usage): postgres_changes subscriptions
--    only fire for tables in the supabase_realtime publication. RLS still
--    gates which rows each subscriber receives.
alter publication supabase_realtime add table feed_entries;
alter publication supabase_realtime add table fist_bumps;
alter publication supabase_realtime add table friend_requests;
