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

Live site: **https://samarthjo.github.io/andaaza/**, served by GitHub Pages
from the `docs/` folder on `main` (Settings → Pages → Deploy from a branch →
`main` → `/docs`).

To publish changes, rebuild `docs/` and push:

```bash
npm run build:pages
git add docs && git commit -m "Rebuild site" && git push
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
every question scheduled once, napkin maths within 1.5× of the answer, reruns
deterministic).

End-to-end play-through (needs a running preview server and Playwright):

```bash
npm run build && npm run preview &
npm run test:e2e
```

## How it works

| Piece | Where |
| --- | --- |
| Scoring: factor = max(guess/answer, answer/guess); day = geometric mean, each capped at 1000× | `src/lib/core/score.ts` |
| Guess parsing and Indian/international number formatting | `src/lib/core/number.ts` |
| Calculator (safe parser, no eval) | `src/lib/core/calc.ts` |
| Daily rotation in Asia/Kolkata, puzzle numbers, countdown | `src/lib/core/date.ts` |
| Question bank (48 questions) and 16-day schedule | `src/lib/data/` |
| Game screens | `src/routes/play`, `src/lib/components` |
| Local persistence (`andaaza:v1:*` in localStorage) | `src/lib/state/storage.ts` |
| Optional online mode | `src/lib/state/online.ts`, `supabase/migrations` |

`LAUNCH_DATE` in `src/lib/core/date.ts` sets puzzle No. 1. After the 16
hand-curated days run out, a deterministic seeded rotation replays earlier
questions (marked "Rerun") until new ones are added to `SCHEDULE`.

## Adding questions

1. Add an entry to `src/lib/data/questions.ts` with answer, unit, source, year,
   confidence and a napkin-maths walkthrough.
2. Add a triple of ids to the end of `src/lib/data/schedule.ts`.
3. `npm test`: the bank tests fail on a missing field, duplicate id, unscheduled
   question, or napkin maths that lands more than 1.5× from the answer.

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
- Tables are locked behind RLS with no policies. Browsers can only call the five
  validated `andaaza_*` functions in `supabase/migrations/`, which store anonymous
  guesses (random session id, no names or emails unless a player sets a nickname).
- Histograms use 21 log-scale bins: guesses from ÷10 to ×10 of the answer, day
  scores from 1× to 1,000×.
- `npm run test:e2e` intercepts every Supabase call with canned data, so tests never
  write to the real database.

To run without a backend, delete `.env.production`; the game falls back to fully
offline play (charts show only your own marker).

## Credits

Icons: [Tabler Icons](https://tabler.io/icons) (MIT License). The Aryabhata
illustration is an original SVG (`src/lib/components/landing/Aryabhata.svelte`);
no portrait of Aryabhata survives, so it is a stylised figure, not a likeness.
