-- Fix: is_handle_available said an already-onboarded user's own existing
-- handle was "taken" when they re-checked it (e.g. revisiting onboarding,
-- or later editing their profile). Exclude the caller's own row.
create or replace function public.is_handle_available(check_handle text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from profiles
    where handle = lower(check_handle)
      and user_id is distinct from auth.uid()
  );
$$;
