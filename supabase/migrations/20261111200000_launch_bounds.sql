-- Nobody can have played before puzzle No. 1 (2026-11-01, LAUNCH_DATE in src/lib/core/date.ts).
-- Refuse games and guesses dated earlier, so day counts and streaks on the leaderboard can never
-- exceed the number of puzzles so far (11 on puzzle No. 11).

create or replace function public.andaaza_record_answer(
  p_session text, p_date date, p_mode text, p_idx int, p_question_id text,
  p_guess double precision, p_factor double precision, p_bucket int
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_date > (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'future puzzle';
  end if;
  if p_date < date '2026-11-01' then
    raise exception 'before launch';
  end if;
  insert into andaaza_answers (session, puzzle_date, mode, idx, question_id, guess, factor, bucket)
  values (p_session, p_date, p_mode, p_idx, p_question_id, p_guess, least(p_factor, 1e9), p_bucket)
  on conflict do nothing;
end $$;

create or replace function public.andaaza_record_game(
  p_session text, p_date date, p_mode text, p_score double precision, p_nickname text
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_name text := left(nullif(btrim(p_nickname), ''), 24);
begin
  if p_date > (now() at time zone 'Asia/Kolkata')::date then
    raise exception 'future puzzle';
  end if;
  if p_date < date '2026-11-01' then
    raise exception 'before launch';
  end if;
  insert into andaaza_games (session, puzzle_date, mode, score, nickname)
  values (p_session, p_date, p_mode, least(greatest(p_score, 1), 1000), v_name)
  on conflict (session, puzzle_date) do update
    set nickname = coalesce(excluded.nickname, andaaza_games.nickname),
        is_test  = andaaza_games.is_test and excluded.nickname is null;
  if v_name is not null then
    update andaaza_answers set is_test = false
    where session = p_session and puzzle_date = p_date and is_test;
  end if;
end $$;

revoke all on function public.andaaza_record_answer(text, date, text, int, text, double precision, double precision, int) from public;
revoke all on function public.andaaza_record_game(text, date, text, double precision, text) from public;
grant execute on function public.andaaza_record_answer(text, date, text, int, text, double precision, double precision, int) to anon, authenticated;
grant execute on function public.andaaza_record_game(text, date, text, double precision, text) to anon, authenticated;
