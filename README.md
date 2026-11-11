# Andaaza (अंदाज़ा)

A free daily estimation game for India. Three questions a day about Indian life,
from villages and votes to IPL sixes and ISRO. One guess each, scored by how many
times off you were.

Built clean-room after studying how a similar game works with
[REA](https://github.com/morluto/rea). See `research/REA-REPORT.md` for the analysis
and `research/SPEC.md` for the product spec. No code, questions, copy or assets
were taken from the analysed site.

## Run it

```bash
npm install
npm run dev
```

Live sites: **https://andaaza-two.vercel.app** (Vercel builds every push to `main`)
and **https://samarthjo.github.io/andaaza/**, served by GitHub Pages straight from
the root of `main` (Settings → Pages → Deploy from a branch → `main` → `/ (root)`).

The Pages copy is prebuilt: `index.html`, the other `.html` pages and `_app/` at
the repo root are build output, listed in `.pages-files` (`.nojekyll` stops Pages
from rendering this README instead). Edit `src/`, never those files. To publish
changes to Pages, rebuild and push:

```bash
npm run build:pages
git add -A && git commit -m "Rebuild Pages site" && git push
```

Plain production build (static files in `build/`, deployable to any static host):

```bash
npm run build
npm run preview
```

## Tests

```bash
npm test
```

Unit tests cover number parsing (lakh/crore, k/M/B, Indian grouping), scoring, IST
date rollover, the calculator, stats/streaks, and the question bank (unique ids,
every question scheduled once, the mota hisab working within 1.5× of the answer,
reruns deterministic) and the sync merge rules.

End-to-end play-through (needs a running preview server and Playwright):

```bash
npm run build && npm run preview &
npm run test:e2e
```

## How it works

Every day at midnight India time a new puzzle opens: three questions, one guess
each, no Googling.

<table>
  <tr>
    <td align="center" valign="top" width="33%">
      <img src="screenshots/home.png" width="240" alt="Today's card reading Ek padha-likha andaaza maaro, with a Play button"><br>
      <b>1. Today's card</b><br>
      <sub>Three topics, one tap to start.</sub>
    </td>
    <td align="center" valign="top" width="33%">
      <img src="screenshots/question.png" width="240" alt="Question card with the guess 40 lakh typed in"><br>
      <b>2. Guess</b><br>
      <sub>Type 45000, 4.5 lakh or 2 crore. The card shows the number in full as you type.</sub>
    </td>
    <td align="center" valign="top" width="33%">
      <img src="screenshots/calculator.png" width="240" alt="Calculator with round keys, lakh and crore buttons and a Use as my guess button"><br>
      <b>3. Work it out</b><br>
      <sub>Calculator with lakh and crore keys, π, and a scratch pad for each question.</sub>
    </td>
  </tr>
  <tr>
    <td align="center" valign="top">
      <img src="screenshots/reveal.png" width="240" alt="Reveal showing your guess, the answer with its source, how many times off, and a bar chart of everyone's guesses"><br>
      <b>4. See the answer</b><br>
      <sub>How many times off you were (1× is perfect) and where everyone else's guesses landed.</sub>
    </td>
    <td align="center" valign="top">
      <img src="screenshots/mota-hisab.png" width="240" alt="Mota hisab panel showing one way to estimate the answer step by step"><br>
      <b>5. Mota hisab</b><br>
      <sub>One way to estimate it, step by step, and how close that gets.</sub>
    </td>
    <td align="center" valign="top">
      <img src="screenshots/results.png" width="240" alt="Results card with the day's score, a verdict, a rank and a bar chart of everyone's scores"><br>
      <b>6. Your score</b><br>
      <sub>The average of your three misses, your rank and the day's spread. Share it as a card or text.</sub>
    </td>
  </tr>
  <tr>
    <td align="center" valign="top">
      <img src="screenshots/profile-panel.png" width="240" alt="You panel with played, day streak, average and best tiles, four colour themes and a box for your leaderboard name"><br>
      <b>You</b><br>
      <sub>Your stats, four colour themes and your name on the leaderboard. No login.</sub>
    </td>
    <td align="center" valign="top">
      <img src="screenshots/menu.png" width="240" alt="Menu with the archive of past puzzles and today's top three on the leaderboard"><br>
      <b>Menu</b><br>
      <sub>Every past puzzle, today's top three, and a way to send in a question.</sub>
    </td>
    <td align="center" valign="top">
      <img src="screenshots/leaderboard.png" width="240" alt="Leaderboard with Today, 7 days, All time and Streaks tabs, your name, today's score spread and the ranked list"><br>
      <b>Leaderboard</b><br>
      <sub>Today, the last 7 days, all time and streaks, with the day's score spread.</sub>
    </td>
  </tr>
</table>

On a laptop:

<p>
  <img src="screenshots/desktop-results.png" width="49%" alt="Results on a laptop: score on the left, everyone's scores on the right">
  <img src="screenshots/desktop-calculator.png" width="49%" alt="Calculator on a laptop: lined scratch pad on the left, keypad on the right">
</p>

<sub>Screenshots come from `npm run test:e2e`, which fills the crowd charts and
leaderboard with sample data. More (how to play, dark mode, FAQ, laptop home page) in
[`screenshots/`](screenshots/).</sub>

### Scoring

- Each guess scores how many times off it was: `max(guess / answer, answer / guess)`.
  1× is perfect, 2× means half or double.
- The day's score is the geometric mean of the three, each capped at 1,000×. Lower is better.
- The crowd charts bucket guesses on a log scale from ÷10 to ×10 of the answer, and
  day scores from 1× to 1,000×.

### Where things live

| Piece | Where |
| --- | --- |
| Scoring, verdicts, crowd buckets and ranks | `src/lib/core/score.ts` |
| Guess parsing and Indian/international number formatting | `src/lib/core/number.ts` |
| Calculator maths (safe parser, no eval) | `src/lib/core/calc.ts` |
| Daily rotation in Asia/Kolkata, puzzle numbers, countdown | `src/lib/core/date.ts` |
| Question bank (48 questions) and 16-day schedule | `src/lib/data/` |
| Game cards (intro, question, reveal, results, charts) | `src/lib/game/` |
| Panels, calculator, sheets, icons | `src/lib/components/` |
| Local persistence (`andaaza:v1:*` in localStorage) | `src/lib/state/storage.ts` |
| Online mode (crowd charts, leaderboard) | `src/lib/state/online.ts`, `supabase/migrations/` |

`LAUNCH_DATE` in `src/lib/core/date.ts` sets puzzle No. 1. After the 16
hand-curated days run out, a deterministic seeded rotation replays earlier
questions (marked "Rerun") until new ones are added to `SCHEDULE`.

## Adding questions

1. Add an entry to `src/lib/data/questions.ts` with answer, unit, source, year,
   confidence and a mota hisab walkthrough (the `napkin` field).
2. Add a triple of ids to the end of `src/lib/data/schedule.ts`.
3. `npm test`: the bank tests fail on a missing field, duplicate id, unscheduled
   question, or a mota hisab (the `napkin` field) that lands more than 1.5× from the answer.

## Before a public launch

- **Fact-check every answer.** Figures came from public sources known at writing
  time. Questions marked `confidence: 'medium'` (about half) especially need a fresh
  check against the named source.
- Set `LAUNCH_DATE` to the real launch day.
- Pick a domain and set `VITE_SITE_URL` so share text links to it.

## Online mode (crowd charts, leaderboard, question inbox)

Online mode is on. The "How everyone guessed" and "How everyone did" bar charts,
the "closer than X% of players" line, the leaderboard and the question inbox use a
Supabase project (`andaaza`, ref `pqvppabcdbenzrlbxzkw`, Mumbai region).

- `.env.production` holds the public project URL and **publishable** key. Both are
  meant to be public; Vercel and `npm run build:pages` pick them up automatically.
- Tables are locked behind RLS with no policies. Browsers can only call the six
  validated `andaaza_*` functions in `supabase/migrations/`, which store anonymous
  guesses (a random id per browser, and a name only if the player sets one for the
  leaderboard).
- Histograms use 21 log-scale bins: guesses from ÷10 to ×10 of the answer, day
  scores from 1× to 1,000×.
- `npm run test:e2e` intercepts every Supabase call with canned data, so tests never
  write to the real database.

To run without a backend, delete `.env.production`; the game falls back to fully
offline play (charts show only your own marker).

Finished games that never reached the backend (played offline, or before online
mode) are sent once on the next visit, so a player's own result always shows in
the charts.

While the game is new, sample players fill the gaps (`src/lib/core/samples.ts`): each
guess and score chart is topped up to 100 entries and each leaderboard tab to 50 rows
with random names, seeded by date so everyone sees the same crowd and it reshuffles
every day. Samples step aside as real players arrive, a small note says when they're
showing, and "closer than X%" and "Top X%" only ever count real players. Set
`CHART_TARGET` and `BOARD_TARGET` to 0 to turn them off.

Test data never counts as real (`supabase/migrations/20261111170000_real_players.sql`).
That covers every game and guess recorded before launch, and anything played later in
a browser the owner tested with: one where a pre-launch test account (listed in
`andaaza_test_accounts`) played.

## Leaderboard names

There are no accounts and no login. Anyone can pick a colour theme, and anyone who adds
a name (in the You panel or on the leaderboard) joins the leaderboard. A player is one
browser, named by its latest daily game, so clearing the name takes it off the board
from the next puzzle. A name added after finishing today's puzzle puts that game on
today's board straight away.

Accounts existed briefly before launch;
`supabase/migrations/20261111180000_remove_accounts.sql` drops their tables. The users
left under Supabase → Authentication → Users are the owner's test accounts.

## Credits

Icons: [Tabler Icons](https://tabler.io/icons) (MIT License). The Aryabhata
illustration is an original SVG (`src/lib/components/landing/Aryabhata.svelte`);
no portrait of Aryabhata survives, so it is a stylised figure, not a likeness.
