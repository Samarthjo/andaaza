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

  function lean(st: PlayerStats): string {
    if (st.highShare === null || st.lean === null) return '';
    const pct = Math.round(st.highShare * 100);
    if (st.lean > 1.15) return `You guess high: ${pct}% of your guesses were too big.`;
    if (st.lean < 1 / 1.15) return `You guess low: ${100 - pct}% of your guesses were too small.`;
    return `Balanced: ${pct}% too high, ${100 - pct}% too low.`;
  }
</script>

<svelte:head>
  <title>Your Andaaza stats</title>
</svelte:head>

<section class="page">
  <h1>Your stats</h1>

  {#if s && s.played === 0}
    <p class="empty">Nothing here yet. Your first finished puzzle starts it.</p>
    <a class="btn" href="{base}/play">Play today’s puzzle</a>
  {:else if s}
    <dl class="tiles num">
      <div class="wide">
        <dt>Typical day</dt>
        <dd><span class="double-rule">{s.averageScore !== null ? formatFactor(s.averageScore) : '–'}</span></dd>
      </div>
      <div><dt>Finished</dt><dd>{s.played}</dd></div>
      <div><dt>Best day</dt><dd>{s.bestScore !== null ? formatFactor(s.bestScore) : '–'}</dd></div>
      <div><dt>Streak</dt><dd>{s.currentStreak}</dd></div>
      <div><dt>Longest streak</dt><dd>{s.maxStreak}</dd></div>
    </dl>

    <p class="lean">{lean(s)}</p>

    {#if trend}
      <figure class="trend surface">
        <figcaption>Recent days, lower is better</figcaption>
        <svg viewBox="0 0 {W} {H}" role="img" aria-label="Line chart of your recent day scores">
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

    <p class="note">Saved in this browser only.</p>
  {/if}
</section>

<style>
  .page {
    max-width: 44rem;
    margin: 0 auto;
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
    gap: 0.6rem;
  }
  .tiles div {
    padding: 0.85rem 1rem;
    border-radius: 18px;
    background: var(--surface);
    box-shadow: var(--shadow);
  }
  .tiles .wide {
    grid-column: span 2;
    background: var(--binding);
    color: var(--binding-ink);
  }
  .tiles .wide dt {
    color: inherit;
    opacity: 0.8;
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
  .trend {
    margin: 0;
    padding: 1rem;
    display: grid;
    gap: 0.4rem;
  }
  figcaption {
    font-weight: 600;
    font-size: var(--t-sm);
  }
  svg {
    width: 100%;
    height: auto;
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
    fill: var(--surface);
    stroke: var(--binding);
    stroke-width: 2;
  }
</style>
