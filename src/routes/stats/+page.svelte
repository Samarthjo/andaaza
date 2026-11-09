<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { formatShortDate, istDateKey } from '$lib/core/date';
  import { formatFactor } from '$lib/core/number';
  import { computeStats, type PlayerStats } from '$lib/core/stats';
  import { allGames } from '$lib/state/storage';

  let s = $state<PlayerStats | null>(null);

  onMount(() => {
    s = computeStats(allGames(), istDateKey());
  });

  // Trend: day scores on a log axis, 1× at the top.
  const W = 320;
  const H = 120;
  const trend = $derived.by(() => {
    if (!s || s.recent.length < 2) return null;
    const top = Math.max(10, ...s.recent.map((r) => r.score));
    const y = (v: number) => (Math.log10(v) / Math.log10(top)) * (H - 16) + 8;
    const pts = s.recent.map((r, i) => [(i / (s!.recent.length - 1)) * (W - 16) + 8, y(r.score)] as const);
    return { pts, top, line: pts.map(([x, yy]) => `${x.toFixed(1)},${yy.toFixed(1)}`).join(' ') };
  });

  function leanSentence(st: PlayerStats): string {
    if (st.highShare === null || st.lean === null) return '';
    const pct = Math.round(st.highShare * 100);
    if (st.lean > 1.15) return `You lean high: ${pct}% of your guesses were too big, by ${formatFactor(st.lean)} on average.`;
    if (st.lean < 1 / 1.15)
      return `You lean low: ${100 - pct}% of your guesses were too small, by ${formatFactor(1 / st.lean)} on average.`;
    return `Nicely balanced: ${pct}% of your guesses were too high and ${100 - pct}% too low.`;
  }
</script>

<svelte:head>
  <title>Your Andaaza stats</title>
</svelte:head>

<section class="page">
  <h1>Your stats</h1>

  {#if s && s.played === 0}
    <p class="empty">Your stats start with your first finished puzzle.</p>
    <a class="btn" href="{base}/play">Play today’s puzzle</a>
  {:else if s}
    <dl class="tiles num">
      <div><dt>Puzzles finished</dt><dd>{s.played}</dd></div>
      <div><dt>Current streak</dt><dd>{s.currentStreak} {s.currentStreak === 1 ? 'day' : 'days'}</dd></div>
      <div><dt>Longest streak</dt><dd>{s.maxStreak} {s.maxStreak === 1 ? 'day' : 'days'}</dd></div>
      <div><dt>Best day</dt><dd>{s.bestScore !== null ? formatFactor(s.bestScore) : '–'}</dd></div>
      <div class="wide">
        <dt>Typical day</dt>
        <dd><span class="double-rule">{s.averageScore !== null ? formatFactor(s.averageScore) : '–'}</span></dd>
      </div>
    </dl>

    <p class="lean">{leanSentence(s)}</p>

    {#if trend}
      <figure class="trend">
        <figcaption>Recent days (lower is better)</figcaption>
        <svg viewBox="0 0 {W} {H}" role="img" aria-label="Line chart of your recent day scores">
          <line x1="8" x2={W - 8} y1="8" y2="8" class="axis" />
          <text x={W - 8} y="20" text-anchor="end" class="ax">1×</text>
          <text x={W - 8} y={H - 2} text-anchor="end" class="ax">{formatFactor(trend.top)}</text>
          <polyline points={trend.line} class="ln" />
          {#each trend.pts as [x, y], i (i)}<circle cx={x} cy={y} r="3" class="dot" />{/each}
        </svg>
        <p class="range">
          {formatShortDate(s.recent[0].dateKey)} to {formatShortDate(s.recent[s.recent.length - 1].dateKey)}
        </p>
      </figure>
    {/if}

    <p class="note">Stats live in this browser. Clearing site data or switching phones starts them over.</p>
  {/if}
</section>

<style>
  .page {
    padding: 0.75rem var(--gutter);
    display: grid;
    gap: 1.25rem;
  }
  h1 {
    font-size: var(--t-2xl);
  }
  .empty,
  .note,
  .range {
    color: var(--ink-soft);
    font-size: var(--t-sm);
  }
  .btn {
    justify-self: start;
  }
  .tiles {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    border-top: 6px solid var(--binding);
  }
  .tiles div {
    padding: 0.8rem 0;
    border-bottom: 1px solid var(--rule);
  }
  .tiles div:nth-child(odd):not(.wide) {
    padding-right: 1rem;
  }
  .tiles .wide {
    grid-column: span 2;
  }
  dt {
    font-size: var(--t-sm);
    color: var(--ink-soft);
  }
  dd {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--t-xl);
  }
  .wide dd {
    font-size: var(--t-3xl);
    line-height: 1.1;
  }
  .wide .double-rule {
    display: inline-block;
  }
  .lean {
    max-width: 34rem;
  }
  .trend {
    margin: 0;
    display: grid;
    gap: 0.4rem;
  }
  figcaption {
    font-weight: 600;
    font-size: var(--t-sm);
  }
  svg {
    width: 100%;
    max-width: 30rem;
    height: auto;
  }
  .axis {
    stroke: var(--rule);
    stroke-width: 1;
  }
  .ax {
    fill: var(--ink-soft);
    font-size: 10px;
  }
  .ln {
    fill: none;
    stroke: var(--binding);
    stroke-width: 2;
  }
  .dot {
    fill: var(--page);
    stroke: var(--binding);
    stroke-width: 2;
  }
</style>
