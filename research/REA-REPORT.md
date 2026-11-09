# REA analysis of fermi.gg (reference only)

Date: 2026-11-09. Tooling: REA CLI `rea-agents@6.8.0` (from github.com/morluto/rea),
headless Chromium 153 over CDP, Playwright HAR recording.

Purpose: understand how a daily estimation game is put together so Andaaza can be
built **from scratch** for an Indian audience. Nothing from fermi.gg (code,
question text, answers, images, copy, branding, fonts) is reused in Andaaza.
The site's robots.txt declares `Content-Signal: ai-train=no, use=reference`; this
analysis is reference use only and none of its content was used for training.

## What was run

| Step | REA command / method | Result |
| --- | --- | --- |
| 1 | `curl` of `/` plus every `_app/immutable/*` chunk, following imports to closure | 61 files, 12 route nodes, no source maps published |
| 2 | `rea analyze-javascript-application <dir> --artifact-format directory` | 47 JS sources parsed, 286,607 AST nodes, 1,705 findings; endpoint `/content-version.json`, `localStorage` + `sessionStorage` use, one `new Worker()` |
| 3 | `rea inspect-web-page` against Chromium CDP (`--include-storage-keys`) | Page storage: `fermi:puzzle:<n>`, `fermi:introShuffleSeen`; no IndexedDB/cache |
| 4 | Playwright play-through with HAR recording; **all non-GET third-party calls aborted** so nothing was written to the site's backend | 230 requests recorded |
| 5 | `rea inspect-web-network-capture fermi.har har` (after normalising Playwright's `-1` timings for aborted entries) | Full client↔backend protocol, see below |

## Architecture

- **Frontend:** SvelteKit (Svelte 5 runes), prerendered with SSR, served from Cloudflare.
  Routes: `/`, `/archive`, `/about`, `/leaderboard`, `/stats` (+ sign-in flows).
- **Content:** the whole question bank is compiled into a JS chunk as a
  date → question-ids map. Each question carries prompt, unit, answer, source,
  caveats, a worked "napkin math" breakdown, an optional image and confidence flags.
- **Daily rotation:** date key computed in a fixed timezone (America/New_York);
  puzzle number = days since launch + 1. Archive replays use `/?d=YYYY-MM-DD`.
- **Cache busting:** client polls `/content-version.json?t=<now>` to detect new deploys.
- **Backend:** Supabase (PostgREST RPCs + auth), Google Analytics, an ad CDN (gated off).

### Client → backend protocol (observed, writes blocked)

| RPC | When | Payload shape |
| --- | --- | --- |
| `fermi_play_start` | first question shown | session id, mode (`daily`/`archive`), date, puzzle number, question ids |
| `fermi_play_answer` | each guess locked | session id, date, question index, factor, bucket (0–10), guess |
| `fermi_play_completed` | results screen | session id, date |
| `fermi_puzzle_stats_payload` | after each reveal | date → crowd histograms + percentiles |
| `fermi_board` | leaderboard | board name (`today`, …) |
| `fermi_record_game`, `fermi_set_username`, `fermi_claim_history`, … | signed-in accounts | (not exercised) |
| `fermi_question_submissions` / `feedback` tables | submit-a-question / feedback | (not exercised) |

### Local state

`localStorage` keys: per-puzzle state (`…:puzzle:<n>` with question ids, guesses,
mode), theme, palette, unit system, scratch pad, calculator pads, intro flag,
pending offline writes, and a session id.

## Game mechanics (as observed)

1. Three questions per day, one guess each, no hints. Built-in calculator + scratch pad.
2. **Per-question factor** = `max(guess/answer, answer/guess)`; 1× is perfect.
   Direction is reported as too high / too low / exact.
3. **Day score** = geometric mean of the three factors, each capped at **1000×**
   (verified: factors 1453, 72.2, 1.63 → displayed 49.0×; uncapped would be 55.5×).
4. Factor display: 2 decimals under 10×, 1 decimal under 100×, else grouped integer.
5. Crowd view: guesses bucketed on a log scale around the answer; "closer than X% of players".
6. Results: score, crowd histogram on a 1×–1000× log axis, per-question list with
   ↑/↓, share image + copy text, countdown to next puzzle, last-7-days strip.
7. Extras: archive (list + calendar, filters), personal stats (played, streak,
   best day, average multiple, high/low bias), leaderboard (today / 7 days / all
   time / streaks / badges), accounts, submit-a-question board, themes/palettes.

## Limitations

- Static request extraction misses calls made through the Supabase client wrapper;
  the HAR capture filled that gap.
- Backend responses were never received (calls aborted on purpose), so crowd
  histogram response shapes are inferred from client code only.
- Account/sign-in flows were not exercised.
