-- Handle search for Add Friend (FD §11). profiles RLS is owner-only, so
-- search goes through a narrow security-definer function exposing only the
-- public-card fields, never the full row.
create function public.search_profiles(q text)
returns table (user_id uuid, handle text, display_name text, avatar_url text)
language sql
stable
security definer
set search_path = public
as $$
  select p.user_id, p.handle, p.display_name, p.avatar_url
  from profiles p
  where p.handle is not null
    and p.user_id <> auth.uid()
    and p.handle ilike '%' || lower(q) || '%'
  order by p.handle
  limit 10;
$$;

grant execute on function public.search_profiles(text) to authenticated;
