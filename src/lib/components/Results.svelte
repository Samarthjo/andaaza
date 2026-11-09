<script lang="ts">
  import { base } from '$app/paths';
  import { formatFactor, type NumberStyle } from '$lib/core/number';
  import { dayScore, emojiFor, factorOf, SCORE_EDGES, scoreBucketOf, sideLabel, sideOf, verdictFor } from '$lib/core/score';
  import type { Puzzle } from '$lib/data/puzzle';
  import { copyText, shareCard, shareText } from '$lib/share';
  import Countdown from './Countdown.svelte';
  import CrowdBars from './CrowdBars.svelte';
  import WeekStrip from './WeekStrip.svelte';

  let {
    puzzle,
    guesses,
    isToday,
    today,
    scoreCrowd,
    onreview
  }: {
    puzzle: Puzzle;
    guesses: number[];
    isToday: boolean;
    today: string;
    numberStyle: NumberStyle;
    scoreCrowd: number[] | null;
    onreview: (i: number) => void;
  } = $props();

  const factors = $derived(puzzle.questions.map((q, i) => factorOf(guesses[i], q.answer)));
  const score = $derived(dayScore(factors));
  const verdict = $derived(verdictFor(score));
  let status = $state('');

  async function share() {
    status = 'Preparing image…';
    const r = await shareCard(puzzle, guesses);
    status = r === 'shared' ? 'Shared.' : r === 'downloaded' ? 'Image saved to your downloads.' : '';
  }
  async function copy() {
    status = (await copyText(shareText(puzzle, guesses))) ? 'Copied. Paste it in your group chat.' : 'Copy failed. Select and copy the text manually.';
  }

  const scoreLabels = SCORE_EDGES.map((e, i) => (i === 0 ? '≤1.25' : i === SCORE_EDGES.length - 1 ? `>${SCORE_EDGES[i - 1]}` : `${e}`));
</script>

<section class="results">
  <p class="eyebrow">{isToday ? 'Today’s total' : `Total for No. ${puzzle.number}`}</p>
  <p class="score num"><span class="double-rule">{formatFactor(score)}</span></p>
  <p class="verdict tone-{verdict.tone}">{verdict.label}</p>
  <p class="explain">
    On average you were {formatFactor(score)} away from the answers. Lower is better; 1× is perfect.
  </p>

  <ol class="qs">
    {#each puzzle.questions as q, i (q.id)}
      {@const side = sideOf(guesses[i], q.answer)}
      <li>
        <button class="qrow" onclick={() => onreview(i)}>
          <span class="em" aria-hidden="true">{emojiFor(factors[i])}</span>
          <span class="qt">{q.prompt}</span>
          <span class="qf num">
            <span aria-hidden="true">{sideLabel(side).arrow}</span>
            <span class="visually-hidden">{sideLabel(side).en},</span>
            {formatFactor(factors[i])}
          </span>
        </button>
      </li>
    {/each}
  </ol>

  {#if scoreCrowd}
    <CrowdBars counts={scoreCrowd} mine={scoreBucketOf(score)} labels={scoreLabels} caption="How everyone did today" />
  {/if}

  <div class="actions">
    <button class="btn" onclick={share}>Share image</button>
    <button class="btn secondary" onclick={copy}>Copy result text</button>
  </div>
  <p class="status" role="status">{status}</p>

  {#if isToday}<Countdown />{/if}

  <WeekStrip {today} current={puzzle.dateKey} />

  <p class="more"><a href="{base}/archive">Play earlier puzzles</a> or <a href="{base}/stats">see your stats</a>.</p>
</section>

<style>
  .results {
    display: grid;
    gap: 0.9rem;
  }
  .eyebrow {
    color: var(--ink-soft);
    font-weight: 500;
  }
  .score {
    font-family: var(--font-display);
    font-size: clamp(4rem, 22vw, 7rem);
    line-height: 1;
  }
  .score .double-rule {
    display: inline-block;
    border-bottom-width: 7px;
    padding-bottom: 0.04em;
  }
  .verdict {
    font-family: var(--font-display);
    font-size: var(--t-xl);
  }
  .tone-bullseye,
  .tone-great {
    color: var(--good);
  }
  .tone-good {
    color: var(--accent);
  }
  .tone-meh,
  .tone-far {
    color: var(--warn);
  }
  .tone-wild {
    color: var(--bad);
  }
  .explain {
    font-size: var(--t-sm);
    color: var(--ink-soft);
    max-width: 30rem;
  }
  .qs {
    list-style: none;
    padding: 0;
    margin: 0.4rem 0 0;
    display: grid;
  }
  .qrow {
    width: 100%;
    display: grid;
    grid-template-columns: 1.6rem 1fr auto;
    gap: 0.6rem;
    align-items: start;
    text-align: left;
    background: none;
    border: none;
    border-bottom: 1px solid var(--rule);
    padding: 0.7rem 0;
    cursor: pointer;
  }
  .qrow:hover .qt {
    text-decoration: underline;
    text-decoration-color: var(--margin);
  }
  .qt {
    font-size: var(--t-sm);
    line-height: 1.35;
  }
  .qf {
    font-family: var(--font-display);
    font-size: var(--t-lg);
    white-space: nowrap;
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    margin-top: 0.4rem;
  }
  .actions .btn {
    flex: 1 1 10rem;
  }
  .status {
    min-height: 1.4em;
    font-size: var(--t-sm);
    color: var(--ink-soft);
  }
  .more {
    font-size: var(--t-sm);
  }
</style>
