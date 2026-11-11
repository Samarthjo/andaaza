-- Real players only.
--
-- Everything recorded before launch was testing. The accounts that exist when this runs are the
-- owner's test accounts, and every game and guess recorded so far was a test play. None of it
-- counts on the leaderboard, in the streaks or in the crowd charts. The same goes for anything
-- played later by a test account, or in a browser where a test account has played.
--
-- Anyone else who plays, signed in or not, is a real player. Until real players arrive, the
-- sample players in src/lib/core/samples.ts fill every board and chart, reshuffled each day.
--
-- To count a test account again, delete its row from andaaza_test_accounts.
-- To make another account a test account, insert its user id there.

create table if not exists public.andaaza_test_accounts (
  user_id  uuid primary key references auth.users (id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table public.andaaza_test_accounts enable row level security;
revoke all on public.andaaza_test_accounts from anon, authenticated;

-- Every account that exists right now is a test account.
insert into public.andaaza_test_accounts (user_id)
select id from auth.users
on conflict (user_id) do nothing;

-- Every game and guess recorded so far was a test play.
alter table public.andaaza_games add column if not exists is_test boolean not null default false;
alter table public.andaaza_answers add column if not exists is_test boolean not null default false;
update public.andaaza_games set is_test = true where created_at <= now();
update public.andaaza_answers set is_test = true where created_at <= now();

-- Browsers (session ids) that have recorded a game while logged in to a test account.
create or replace view public.andaaza_test_sessions with (security_invoker = true) as
  select distinct g.session
  from public.andaaza_games g
  join public.andaaza_test_accounts t on t.user_id = g.user_id;

create or replace view public.andaaza_real_games with (security_invoker = true) as
  select g.*
  from public.andaaza_games g
  where not g.is_test
    and not exists (select 1 from public.andaaza_test_sessions s where s.session = g.session);

create or replace view public.andaaza_real_answers with (security_invoker = true) as
  select a.*
  from public.andaaza_answers a
  where not a.is_test
    and not exists (select 1 from public.andaaza_test_sessions s where s.session = a.session);

revoke all on public.andaaza_test_sessions, public.andaaza_real_games, public.andaaza_real_answers from anon, authenticated;

-- The crowd charts, leaderboard and streaks read real players only.
create or replace function public.andaaza_puzzle_stats(p_date date)
returns json
language sql stable security definer set search_path = public as $$
  with q as (
    select i as idx, array(
      select coalesce((select count(*) from andaaza_real_answers a
                       where a.puzzle_date = p_date and a.idx = i and a.bucket = b), 0)::int
      from generate_series(0, 20) b order by b
    ) as counts
    from generate_series(0, 2) i
  ),
  s as (
    select least(20, greatest(0, floor(log(score) / (3.0 / 21))::int)) as b
    from andaaza_real_games where puzzle_date = p_date
  )
  select json_build_object(
    'players', (select count(*) from andaaza_real_games where puzzle_date = p_date),
    'buckets', (select json_agg(counts order by idx) from q),
    'scores', (select json_agg(coalesce(c, 0) order by g.b)
               from generate_series(0, 20) as g(b)
               left join (select b as bb, count(*)::int as c from s group by b) x on x.bb = g.b)
  );
$$;

create or replace function public.andaaza_leaderboard(p_range text, p_today date)
returns table (nickname text, score double precision, games int)
language sql stable security definer set search_path = public as $$
  select g.nickname, g.score, 1
  from andaaza_real_games g
  where p_range = 'today' and g.puzzle_date = p_today and g.mode = 'daily'
    and g.user_id is not null and g.nickname is not null
  union all
  select (array_agg(g.nickname order by g.created_at desc))[1], exp(avg(ln(g.score))), count(*)::int
  from andaaza_real_games g
  where p_range in ('week', 'all')
    and g.puzzle_date <= p_today
    and (p_range = 'all' or g.puzzle_date >= p_today - 6)
    and g.mode = 'daily' and g.user_id is not null and g.nickname is not null
  group by g.user_id
  having count(*) >= 3
  order by 2 asc
  limit 50;
$$;

create or replace function public.andaaza_streaks(p_today date)
returns table (nickname text, streak int)
language sql stable security definer set search_path = public as $$
  with days as (
    select distinct g.user_id, g.puzzle_date
    from andaaza_real_games g
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
    from andaaza_real_games g
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

revoke all on function public.andaaza_puzzle_stats(date) from public;
revoke all on function public.andaaza_leaderboard(text, date) from public;
revoke all on function public.andaaza_streaks(date) from public;
grant execute on function public.andaaza_puzzle_stats(date) to anon, authenticated;
grant execute on function public.andaaza_leaderboard(text, date) to anon, authenticated;
grant execute on function public.andaaza_streaks(date) to anon, authenticated;
