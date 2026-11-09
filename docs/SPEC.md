# Andaaza — product spec

**Andaaza** (अंदाज़ा, "estimate") is a free daily estimation game for India.
Three questions a day about Indian life, one guess each, scored by how many
times off you are. Clean-room design informed by the REA analysis in
`REA-REPORT.md`; all code, copy, questions and visuals are original.

## Daily puzzle

- Date key = calendar date in **Asia/Kolkata**; new puzzle at 00:00 IST.
- Puzzle number = days since launch (`LAUNCH_DATE`) + 1.
- Each date maps to 3 question ids from the bank. Past the end of the
  hand-curated schedule, a deterministic seeded rotation picks 3 questions
  (labelled "Rerun") so the game never breaks.
- Archive replays any past date via `/play?d=YYYY-MM-DD`; future dates are refused.

## Guessing

- Free-text number input that understands Indian and international notation:
  `12,34,567`, `40 lakh`, `40L`, `2.5 cr`, `1.2 crore`, `3k`, `5 million`, `1.2B`, `5e6`.
- Live preview under the input: Indian grouping + words ("≈ 2.5 crore").
- Calculator (safe expression parser, no `eval`, understands `lakh`/`crore`) and
  a per-puzzle scratch pad.
- One guess per question; locked guesses are final.

## Scoring

- Factor `f = max(g/a, a/g)`; 1× is perfect. Side: `high` / `low` / `exact`.
- Day score = geometric mean of factors, each capped at 1000×.
- Display: `<10` → 2 decimals, `<100` → 1 decimal, else grouped integer, suffixed `×`.
- Verdict tiers (Hinglish):
  | factor | label |
  | --- | --- |
  | ≤ 1.1 | Ekdum sahi! |
  | ≤ 1.5 | Bahut badhiya |
  | ≤ 2 | Accha andaaza |
  | ≤ 5 | Thoda door |
  | ≤ 10 | Kaafi door |
  | > 10 | Arre yaar! |
- Crowd buckets (9, log scale): `<1/10`, `1/10–1/4`, `1/4–1/2`, `1/2–1/1.25`,
  `within 1.25×`, `1.25–2`, `2–4`, `4–10`, `>10`.

## Reveal screen (per question)

Your guess, the answer (Indian formatting + words), source, factor + verdict +
direction (Zyada / Kam), a guess-vs-answer log axis, crowd histogram and
"closer than X%" when the online backend is configured, and an expandable
napkin-math walkthrough.

## Results screen

Day score + tier, per-question list (↑/↓ + factor), share image (canvas PNG via
Web Share API or download) and copy-text, countdown to next IST midnight,
last-7-days strip linking into the archive.

Copy text example:

```
Andaaza #9 · 2.41×
🎯⬇️ 1.12×
🟡⬆️ 3.40×
🟢⬇️ 1.80×
<site url>
```

Emoji: 🎯 ≤1.25 · 🟢 ≤2 · 🟡 ≤4 · 🟠 ≤10 · 🔴 >10.

## Pages

`/` landing (how to play, what is an andaaza question, FAQ, play CTA) ·
`/play` game · `/archive` (filters: all / played / to play) · `/stats`
(played, current + max streak, best day, average, high/low lean, recent trend)
· `/leaderboard` (online mode only) · `/submit` (question idea form) · `/about`.

## Settings

Theme (system / light / dark), palette (Haldi, Neel, Mehendi), number style
(Indian lakh/crore vs international million/billion).

## Persistence

`localStorage` keys prefixed `andaaza:v1:` — per-date game state, settings,
scratch pad, anonymous session id, nickname. All reads/writes guarded.

## Optional online mode (Supabase)

Enabled when `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set at build.
RPCs (security definer, insert-only): `andaaza_record_answer`,
`andaaza_record_game`, `andaaza_puzzle_stats`, `andaaza_leaderboard`,
`andaaza_submit_question`. Schema in `supabase/migrations/`. Without it the game
is fully playable offline; crowd and leaderboard UI hide themselves.

## Question bank

Original questions on Indian everyday life, infrastructure, culture, cricket,
nature and history, each with answer, unit, source, confidence, and napkin math.
Answers are best-available public figures and **must be fact-checked before
public launch** (see `confidence` + `note` fields).
