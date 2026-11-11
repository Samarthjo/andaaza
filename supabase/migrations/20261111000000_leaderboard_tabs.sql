-- Leaderboard tabs: today, last 7 days, all time (signed-in players with a name), and streaks.

-- 'today': today's daily scores. 'week' / 'all': geometric mean of daily scores over the last
-- 7 days / ever, for players with at least 3 games in that window.
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
  where p_range in ('week', 'all')
    and g.puzzle_date <= p_today
    and (p_range = 'all' or g.puzzle_date >= p_today - 6)
    and g.mode = 'daily' and g.user_id is not null and g.nickname is not null
  group by g.user_id
  having count(*) >= 3
  order by 2 asc
  limit 50;
$$;

-- Current daily streaks: consecutive days of daily puzzles ending today or yesterday.
create or replace function public.andaaza_streaks(p_today date)
returns table (nickname text, streak int)
language sql stable security definer set search_path = public as $$
  with days as (
    select distinct g.user_id, g.puzzle_date
    from andaaza_games g
    where g.mode = 'daily' and g.user_id is not null and g.puzzle_date <= p_today
  ),
  runs as (
    select user_id, puzzle_date,
           puzzle_date - (row_number() over (partition by user_id order by puzzle_date))::int as run
    from days
  ),
  streaks as (
    select user_id, count(*)::int as streak, max(puzzle_date) as last_day
    from runs
    group by user_id, run
  ),
  names as (
    select distinct on (g.user_id) g.user_id, g.nickname
    from andaaza_games g
    where g.user_id is not null and g.nickname is not null
    order by g.user_id, g.created_at desc
  )
  select n.nickname, s.streak
  from streaks s
  join names n using (user_id)
  where s.last_day >= p_today - 1
  order by s.streak desc, n.nickname
  limit 50;
$$;

revoke all on function public.andaaza_leaderboard(text, date) from public;
revoke all on function public.andaaza_streaks(date) from public;
grant execute on function public.andaaza_leaderboard(text, date) to anon, authenticated;
grant execute on function public.andaaza_streaks(date) to anon, authenticated;
