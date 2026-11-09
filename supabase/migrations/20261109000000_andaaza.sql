-- Andaaza optional online mode: crowd histograms, leaderboard, question submissions.
-- Tables are locked behind RLS with no policies; the browser only ever calls the
-- SECURITY DEFINER functions below, which validate every argument.

create table if not exists public.andaaza_answers (
  session      text        not null check (char_length(session) between 8 and 64),
  puzzle_date  date        not null,
  mode         text        not null check (mode in ('daily', 'archive')),
  idx          smallint    not null check (idx between 0 and 2),
  question_id  text        not null check (char_length(question_id) <= 16),
  guess        double precision not null check (guess > 0),
  factor       double precision not null check (factor >= 1),
  bucket       smallint    not null check (bucket between 0 and 8),
  created_at   timestamptz not null default now(),
  primary key (session, puzzle_date, idx)
);
create index if not exists andaaza_answers_date_idx on public.andaaza_answers (puzzle_date, idx);

create table if not exists public.andaaza_games (
  session      text        not null check (char_length(session) between 8 and 64),
  puzzle_date  date        not null,
  mode         text        not null check (mode in ('daily', 'archive')),
  score        double precision not null check (score >= 1 and score <= 1000),
  nickname     text        check (nickname is null or char_length(nickname) between 1 and 24),
  created_at   timestamptz not null default now(),
  primary key (session, puzzle_date)
);
create index if not exists andaaza_games_date_idx on public.andaaza_games (puzzle_date, mode);

create table if not exists public.andaaza_question_submissions (
  id          bigint generated always as identity primary key,
  question    text not null check (char_length(question) between 15 and 400),
  answer      text check (char_length(answer) <= 120),
  source      text check (char_length(source) <= 300),
  name        text check (char_length(name) <= 60),
  created_at  timestamptz not null default now()
);

alter table public.andaaza_answers enable row level security;
alter table public.andaaza_games enable row level security;
alter table public.andaaza_question_submissions enable row level security;
revoke all on public.andaaza_answers, public.andaaza_games, public.andaaza_question_submissions from anon, authenticated;

-- Record one locked guess. Idempotent per (session, date, question index).
create or replace function public.andaaza_record_answer(
  p_session text, p_date date, p_mode text, p_idx int, p_question_id text,
  p_guess double precision, p_factor double precision, p_bucket int
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_date > (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'future puzzle';
  end if;
  insert into andaaza_answers (session, puzzle_date, mode, idx, question_id, guess, factor, bucket)
  values (p_session, p_date, p_mode, p_idx, p_question_id, p_guess, least(p_factor, 1e9), p_bucket)
  on conflict do nothing;
end $$;

-- Record a finished day. Idempotent per (session, date).
create or replace function public.andaaza_record_game(
  p_session text, p_date date, p_mode text, p_score double precision, p_nickname text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_date > (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'future puzzle';
  end if;
  insert into andaaza_games (session, puzzle_date, mode, score, nickname)
  values (p_session, p_date, p_mode, least(greatest(p_score, 1), 1000), nullif(btrim(p_nickname), ''))
  on conflict do nothing;
end $$;

-- Crowd data for one puzzle: per-question guess buckets (9 each) and day-score buckets
-- aligned with SCORE_EDGES in src/lib/core/score.ts: 1.25, 1.5, 2, 3, 5, 10, 30, 100, 1000.
create or replace function public.andaaza_puzzle_stats(p_date date)
returns json
language sql stable security definer set search_path = public as $$
  with q as (
    select i as idx, array(
      select coalesce((select count(*) from andaaza_answers a
                       where a.puzzle_date = p_date and a.idx = i and a.bucket = b), 0)::int
      from generate_series(0, 8) b order by b
    ) as counts
    from generate_series(0, 2) i
  ),
  s as (
    select case
      when score <= 1.25 then 0 when score <= 1.5 then 1 when score <= 2 then 2
      when score <= 3 then 3 when score <= 5 then 4 when score <= 10 then 5
      when score <= 30 then 6 when score <= 100 then 7 else 8 end as b
    from andaaza_games where puzzle_date = p_date
  )
  select json_build_object(
    'players', (select count(*) from andaaza_games where puzzle_date = p_date),
    'buckets', (select json_agg(counts order by idx) from q),
    'scores', (select json_agg(coalesce(c, 0) order by b)
               from generate_series(0, 8) b
               left join (select b as bb, count(*)::int as c from s group by b) x on x.bb = b)
  );
$$;

-- Leaderboard of named players. 'today' = daily games on p_today; 'week' = players with
-- at least 3 daily games in the 7 days to p_today, ranked by geometric-mean score.
create or replace function public.andaaza_leaderboard(p_range text, p_today date)
returns table (nickname text, score double precision, games int)
language sql stable security definer set search_path = public as $$
  select g.nickname, g.score, 1
  from andaaza_games g
  where p_range = 'today' and g.puzzle_date = p_today and g.mode = 'daily' and g.nickname is not null
  union all
  select (array_agg(g.nickname order by g.created_at desc))[1], exp(avg(ln(g.score))), count(*)::int
  from andaaza_games g
  where p_range = 'week' and g.puzzle_date between p_today - 6 and p_today
    and g.mode = 'daily' and g.nickname is not null
  group by g.session
  having count(*) >= 3
  order by 2 asc
  limit 50;
$$;

create or replace function public.andaaza_submit_question(
  p_question text, p_answer text, p_source text, p_name text
) returns json
language plpgsql security definer set search_path = public as $$
begin
  insert into andaaza_question_submissions (question, answer, source, name)
  values (btrim(p_question), nullif(btrim(p_answer), ''), nullif(btrim(p_source), ''), nullif(btrim(p_name), ''));
  return json_build_object('ok', true);
end $$;

revoke all on function
  public.andaaza_record_answer(text, date, text, int, text, double precision, double precision, int),
  public.andaaza_record_game(text, date, text, double precision, text),
  public.andaaza_puzzle_stats(date),
  public.andaaza_leaderboard(text, date),
  public.andaaza_submit_question(text, text, text, text)
from public;
grant execute on function
  public.andaaza_record_answer(text, date, text, int, text, double precision, double precision, int),
  public.andaaza_record_game(text, date, text, double precision, text),
  public.andaaza_puzzle_stats(date),
  public.andaaza_leaderboard(text, date),
  public.andaaza_submit_question(text, text, text, text)
to anon, authenticated;
