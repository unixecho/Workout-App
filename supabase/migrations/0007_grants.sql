-- Explicit table grants. RLS policies control *which rows* a role can see,
-- but Postgres still requires the role have privilege on the table itself.
-- Discovered missing on the Frankfurt project (permission denied on public
-- read tables) even though the Sydney project worked without this —
-- apparently not guaranteed by every Supabase project's default privileges.
-- Making it explicit so this can't recur on a future project.
grant usage on schema public to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant all on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant usage, select on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
