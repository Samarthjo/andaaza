-- Accounts are gone (no login): drop what only they used. The leftover users under
-- Authentication → Users were the owner's test accounts. andaaza_games.user_id stays as a
-- historical column (always empty from now on).

drop trigger if exists andaaza_on_auth_user_created on auth.users;
drop function if exists public.andaaza_handle_new_user();
drop table if exists public.andaaza_profiles;
drop table if exists public.andaaza_user_games;
drop view if exists public.andaaza_test_sessions;
drop table if exists public.andaaza_test_accounts;
