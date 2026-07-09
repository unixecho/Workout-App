-- Handle availability check for onboarding S1. `profiles` RLS is strictly
-- owner-only, so a live "is this handle taken?" check needs a narrow,
-- security-definer function that returns a boolean only — never exposes
-- any profile row data.
create function public.is_handle_available(check_handle text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from profiles where handle = lower(check_handle)
  );
$$;

grant execute on function public.is_handle_available(text) to anon, authenticated;
