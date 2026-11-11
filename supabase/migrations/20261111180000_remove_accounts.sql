-- No more accounts: Andaaza has no login. Anyone who sets a name joins the leaderboard, and a
-- player is one browser (its session id). A browser's name is the one on its latest daily game,
-- so clearing the name takes it off the board from the next puzzle.
--
-- This drops the account tables (profiles, synced games) and the sign-up trigger. The
-- andaaza_games.user_id column and andaaza_test_accounts stay: they mark the browsers the
-- owner tested with, which never count as real players (see 20261111170000_real_players.sql).

drop trigger if exists andaaza_on_auth_user_created on auth.users;
drop function if exists public.andaaza_handle_new_user();
drop table if exists public.andaaza_profiles;
drop table if exists public.andaaza_user_games;

-- Record a finished day. Sending it again (after the player adds a name) updates the name.
create or replace function public.andaaza_record_game(
  p_session text, p_date date, p_mode text, p_score double precision, p_nickname text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_date > (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'future puzzle';
  end if;
  insert into andaaza_games (session, puzzle_date, mode, score, nickname)
  values (p_session, p_date, p_mode, least(greatest(p_score, 1), 1000), left(nullif(btrim(p_nickname), ''), 24))
  on conflict (session, puzzle_date) do update
    set nickname = coalesce(excluded.nickname, andaaza_games.nickname);
end $$;

-- 'today': today's named daily scores. 'week' / 'all': geometric mean of a named player's daily
-- scores over the last 7 days / ever, for players with at least 3 daily games in that window.
create or replace function public.andaaza_leaderboard(p_range text, p_today date)
returns table (nickname text, score double precision, games int)
language sql stable security definer set search_path = public as $$
  with daily as (
    select g.session, g.puzzle_date, g.score, g.nickname, g.created_at
    from andaaza_real_games g
    where g.mode = 'daily' and g.puzzle_date <= p_today
  ),
  players as (
    select distinct on (session) session, nickname
    from daily
    order by session, puzzle_date desc, created_at desc
  )
  select d.nickname, d.score, 1
  from daily d
  where p_range = 'today' and d.puzzle_date = p_today and d.nickname is not null
  union all
  select p.nickname, exp(avg(ln(d.score))), count(*)::int
  from daily d
  join players p using (session)
  where p_range in ('week', 'all') and p.nickname is not null
    and (p_range = 'all' or d.puzzle_date >= p_today - 6)
  group by d.session, p.nickname
  having count(*) >= 3
  order by 2 asc
  limit 50;
$$;

-- Current daily streaks of named players: consecutive days ending today or yesterday.
create or replace function public.andaaza_streaks(p_today date)
returns table (nickname text, streak int)
language sql stable security definer set search_path = public as $$
  with daily as (
    select g.session, g.puzzle_date, g.nickname, g.created_at
    from andaaza_real_games g
    where g.mode = 'daily' and g.puzzle_date <= p_today
  ),
  players as (
    select distinct on (session) session, nickname
    from daily
    order by session, puzzle_date desc, created_at desc
  ),
  runs as (
    select session, puzzle_date,
           puzzle_date - (row_number() over (partition by session order by puzzle_date))::int as run
    from (select distinct session, puzzle_date from daily) d
  ),
  streaks as (
    select session, count(*)::int as streak, max(puzzle_date) as last_day
    from runs
    group by session, run
  )
  select p.nickname, s.streak
  from streaks s
  join players p using (session)
  where p.nickname is not null and s.last_day >= p_today - 1
  order by s.streak desc, p.nickname
  limit 50;
$$;

revoke all on function public.andaaza_record_game(text, date, text, double precision, text) from public;
revoke all on function public.andaaza_leaderboard(text, date) from public;
revoke all on function public.andaaza_streaks(date) from public;
grant execute on function public.andaaza_record_game(text, date, text, double precision, text) to anon, authenticated;
grant execute on function public.andaaza_leaderboard(text, date) to anon, authenticated;
grant execute on function public.andaaza_streaks(date) to anon, authenticated;
