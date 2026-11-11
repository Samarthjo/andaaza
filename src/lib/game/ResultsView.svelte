<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { base } from '$app/paths';
  import { formatFactor } from '$lib/core/number';
  import { dayScore, factorOf, rankLabel, scoreBin, scorePosition, sideOf, verdictFor } from '$lib/core/score';
  import type { Puzzle } from '$lib/data/puzzle';
  import { copyText, shareCard, shareText } from '$lib/share';
  import { online } from '$lib/state/online';
  import CardHeader from './CardHeader.svelte';
  import CrowdChart from './CrowdChart.svelte';

  let {
    puzzle,
    guesses,
    scoreCrowd,
    scoreCrowdReal,
    onreview
  }: {
    puzzle: Puzzle;
    guesses: number[];
    /** Chart counts (real scores topped up with sample ones). */
    scoreCrowd: number[] | null;
    /** Real scores only: ranks never count samples. */
    scoreCrowdReal: number[] | null;
    onreview: (i: number) => void;
  } = $props();

  const factors = $derived(puzzle.questions.map((q, i) => factorOf(guesses[i], q.answer)));
  const score = $derived(dayScore(factors));
  const rank = $derived(scoreCrowdReal ? rankLabel(scoreCrowdReal, scoreBin(score)) : null);
  const players = $derived(scoreCrowdReal ? scoreCrowdReal.reduce((a, b) => a + b, 0) : 0);
  const sampled = $derived(!!scoreCrowd && scoreCrowd.reduce((a, b) => a + b, 0) > players);
  const verdict = $derived(verdictFor(score));
  let status = $state('');
  let shown = $state(1);

  onMount(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shown = score;
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 1000);
      shown = Math.exp(Math.log(score) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  });

  async function share() {
    status = 'Making your card…';
    const r = await shareCard(puzzle, guesses);
    status = r === 'shared' ? 'Shared.' : r === 'downloaded' ? 'Card saved to your downloads.' : '';
  }
  async function copy() {
    status = (await copyText(shareText(puzzle, guesses))) ? 'Copied. Paste it in your group chat.' : 'Copy failed. Select the text and copy it yourself.';
  }
</script>

<div class="results">
  <CardHeader {puzzle} answered={3} current="results" onjump={onreview} />

  <div class="split" in:fly={{ y: 14, duration: 340, delay: 80 }}>
    <div class="top">
      <span class="lbl">Your score</span>
      <p class="score num">{formatFactor(shown)}</p>
      <p class="verdict">{verdict.label}</p>
      {#if rank !== null}
        <p class="sub"><span class="tag">{rank}</span> of {players.toLocaleString('en-IN')} players</p>
      {:else if players === 1}
        <p class="sub">First to finish this one.</p>
      {/if}
    </div>
    <div class="dist">
      <span class="lbl">How everyone did</span>
      <CrowdChart kind="score" counts={scoreCrowd} you={scorePosition(score)} labels={['1×', '10×', '100×', '1,000×']} {sampled} />
    </div>
  </div>

  <div class="qs" in:fly={{ y: 14, duration: 340, delay: 300 }}>
    <span class="lbl">Questions</span>
    <ul>
      {#each puzzle.questions as q, i (q.id)}
        {@const side = sideOf(guesses[i], q.answer)}
        <li>
          <button onclick={() => onreview(i)}>
            <span class="qt">{q.prompt}</span>
            <span class="qf num">
              <span aria-hidden="true">{side === 'high' ? '>' : side === 'low' ? '<' : '='}</span>
              <span class="visually-hidden">{side === 'high' ? 'too high by' : side === 'low' ? 'too low by' : 'exact,'}</span>
              {formatFactor(factors[i])}
            </span>
          </button>
        </li>
      {/each}
    </ul>
  </div>

  <div class="actions">
    <div class="share">
      <button class="dark" onclick={share}>Share card</button>
      <button class="outline" onclick={copy}>Copy text</button>
      {#if online}<a class="outline" href="{base}/leaderboard">Leaderboard</a>{/if}
    </div>
    <p class="status" role="status">{status}</p>
  </div>
</div>

<style>
  .results {
    display: grid;
    gap: 1.5rem;
    --marker: #1b1a2e;
    --marker-ink: var(--haldi);
  }
  .split {
    display: grid;
    gap: 1.25rem;
    margin-top: 0.5rem;
  }
  @media (min-width: 40rem) {
    .split {
      grid-template-columns: minmax(0, 0.8fr) 1px minmax(0, 1.5fr);
      gap: 1.75rem;
    }
    .split::before {
      content: '';
      grid-column: 2;
      grid-row: 1;
      background: color-mix(in srgb, currentColor 30%, transparent);
    }
    .top {
      grid-column: 1;
      grid-row: 1;
    }
    .dist {
      grid-column: 3;
      grid-row: 1;
    }
  }
  .top {
    display: grid;
    align-content: start;
    justify-items: start;
    gap: 0.15rem;
    min-width: 0;
  }
  .score {
    margin-top: 0.4rem;
    font-family: var(--font-ui);
    font-weight: 800;
    font-size: clamp(2.8rem, 10vw, 3.8rem);
    line-height: 1;
    letter-spacing: -0.04em;
  }
  .verdict {
    font-family: var(--font-ui);
    font-weight: 800;
    font-size: clamp(1.4rem, 4.6vw, 1.75rem);
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  .sub {
    margin-top: 0.7rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
    font-weight: 700;
    font-size: 1rem;
  }
  .tag {
    padding: 0.2rem 0.7rem;
    border-radius: 999px;
    background: #1b1a2e;
    color: var(--haldi);
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .dist {
    display: grid;
    gap: 0.2rem;
    min-width: 0;
  }
  .qs {
    display: grid;
    gap: 0.25rem;
  }
  ul {
    list-style: none;
    margin: 0.3rem 0 0;
    padding: 0;
  }
  li + li {
    border-top: 1px solid rgb(27 26 46 / 0.2);
  }
  li button {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 0;
    border: none;
    background: none;
    color: inherit;
    text-align: left;
    cursor: pointer;
  }
  .qt {
    font-weight: 700;
    font-size: 0.95rem;
    line-height: 1.35;
  }
  li button:hover .qt {
    text-decoration: underline;
  }
  .qf {
    flex: none;
    font-weight: 800;
    font-size: 1.15rem;
    white-space: nowrap;
  }
  .share {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .share button,
  .share a {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    min-height: 3rem;
    padding: 0 1.6rem;
    border-radius: 999px;
    font-weight: 800;
    font-size: 0.85rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    cursor: pointer;
    transition:
      transform 0.22s var(--ease-out),
      background-color 0.2s ease;
  }
  .share button:hover,
  .share a:hover {
    transform: translateY(-2px);
  }
  .share button:active,
  .share a:active {
    transform: scale(0.97);
  }
  .dark {
    border: 2px solid #1b1a2e;
    background: #1b1a2e;
    color: var(--haldi);
  }
  .outline {
    border: 2px solid #1b1a2e;
    background: transparent;
    color: #1b1a2e;
  }
  /* Takes no room until there is something to say (it stays in the page for screen readers). */
  .status {
    margin: 0;
    font-size: 0.88rem;
    font-weight: 600;
  }
  .status:not(:empty) {
    margin-top: 0.75rem;
  }
</style>
