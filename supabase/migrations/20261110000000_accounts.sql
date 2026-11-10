-- Accounts: per-user game sync and signed-in leaderboard.

-- Each signed-in player's saved games, so puzzles follow them across devices.
create table if not exists public.andaaza_user_games (
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  puzzle_date date not null,
  game        jsonb not null check (pg_column_size(game) < 8000),
  updated_at  timestamptz not null default now(),
  primary key (user_id, puzzle_date)
);

alter table public.andaaza_user_games enable row level security;

drop policy if exists andaaza_user_games_select_own on public.andaaza_user_games;
drop policy if exists andaaza_user_games_insert_own on public.andaaza_user_games;
drop policy if exists andaaza_user_games_update_own on public.andaaza_user_games;
create policy andaaza_user_games_select_own on public.andaaza_user_games
  for select to authenticated using ((select auth.uid()) = user_id);
create policy andaaza_user_games_insert_own on public.andaaza_user_games
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy andaaza_user_games_update_own on public.andaaza_user_games
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

revoke all on public.andaaza_user_games from anon;
grant select, insert, update on public.andaaza_user_games to authenticated;

-- Link finished games to the signed-in player (null for guests).
alter table public.andaaza_games add column if not exists user_id uuid references auth.users (id) on delete set null;
create index if not exists andaaza_games_user_idx on public.andaaza_games (user_id);

-- Record a finished day. A later call (e.g. after signing in) can attach the user and name.
create or replace function public.andaaza_record_game(
  p_session text, p_date date, p_mode text, p_score double precision, p_nickname text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_date > (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'future puzzle';
  end if;
  insert into andaaza_games (session, puzzle_date, mode, score, nickname, user_id)
  values (p_session, p_date, p_mode, least(greatest(p_score, 1), 1000), nullif(btrim(p_nickname), ''), auth.uid())
  on conflict (session, puzzle_date) do update
    set user_id  = coalesce(excluded.user_id, andaaza_games.user_id),
        nickname = coalesce(excluded.nickname, andaaza_games.nickname);
end $$;

-- Leaderboard: signed-in players with a name only.
create or replace function public.andaaza_leaderboard(p_range text, p_today date)
returns table (nickname text, score double precision, games int)
language sql stable security definer set search_path = public as $$
  select g.nickname, g.score, 1
  from andaaza_games g
  where p_range = 'today' and g.puzzle_date = p_today and g.mode = 'daily'
    and g.user_id is not null and g.nickname is not null
  union all
  select (array_agg(g.nickname order by g.created_at desc))[1], exp(avg(ln(g.score))), count(*)::int
  from andaaza_games g
  where p_range = 'week' and g.puzzle_date between p_today - 6 and p_today
    and g.mode = 'daily' and g.user_id is not null and g.nickname is not null
  group by g.user_id
  having count(*) >= 3
  order by 2 asc
  limit 50;
$$;

revoke all on function public.andaaza_record_game(text, date, text, double precision, text) from public;
revoke all on function public.andaaza_leaderboard(text, date) from public;
grant execute on function public.andaaza_record_game(text, date, text, double precision, text) to anon, authenticated;
grant execute on function public.andaaza_leaderboard(text, date) to anon, authenticated;
