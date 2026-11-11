<!--
  Fermi-style 21-bar histogram on a log axis.
  kind="guess": guess/answer from ÷10 to ×10, dashed line at the answer, "You" marker.
  kind="score": day scores from 1× to 1,000×, "You" marker.
  With no crowd data it shows only the axis and markers (never made-up bars).
-->
<script lang="ts">
  import { onMount } from 'svelte';
  import { BINS } from '$lib/core/score';

  let {
    kind,
    counts,
    you,
    labels,
    sampled = false
  }: { kind: 'guess' | 'score'; counts: number[] | null; you: number; labels: string[]; sampled?: boolean } = $props();

  const max = $derived(counts ? Math.max(0, ...counts) : 0);
  const hasData = $derived(max > 0);
  let grown = $state(false);
  onMount(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => (grown = true)));
    return () => cancelAnimationFrame(id);
  });
</script>

<figure class="chart {kind}" class:grown>
  <div class="plot" aria-hidden="true">
    <div class="bars">
      {#each Array(BINS) as _, i (i)}
        <span class="bar" style="--h:{hasData && counts ? (counts[i] / max) * 100 : 0}%;--i:{i}"></span>
      {/each}
    </div>
    {#if kind === 'guess'}<span class="answer-line"></span>{/if}
    <span class="you" style="--x:{you * 100}%"><span class="tag">You</span></span>
  </div>
  <div class="axis num" class:four={labels.length === 4}>
    {#each labels as l, i (i)}
      <span class:mid={kind === 'guess' && i === 1}>
        {l}
        {#if kind === 'guess' && i === 1}<small class="lbl">Answer</small>{/if}
      </span>
    {/each}
  </div>
  {#if counts && !hasData}<figcaption>{kind === 'score' ? 'No scores yet' : 'No other guesses yet'}</figcaption>
  {:else if sampled}<figcaption>Includes sample {kind === 'score' ? 'scores' : 'guesses'} until more people play</figcaption>{/if}
</figure>

<style>
  .chart {
    margin: 0;
    display: grid;
    gap: 0.45rem;
  }
  .plot {
    position: relative;
    height: 7.5rem;
    margin-top: 1.6rem;
    border-bottom: 2px solid color-mix(in srgb, currentColor 35%, transparent);
  }
  @media (min-width: 48rem) {
    .plot {
      height: 9.5rem;
    }
  }
  .bars {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: flex-end;
    gap: 3px;
  }
  .bar {
    flex: 1;
    height: var(--h);
    border-radius: 3px 3px 0 0;
    background: color-mix(in srgb, currentColor 34%, transparent);
    transform: scaleY(0);
    transform-origin: bottom;
    transition: transform 0.6s var(--ease-out) calc(var(--i) * 22ms);
  }
  .grown .bar {
    transform: scaleY(1);
  }
  .answer-line {
    position: absolute;
    left: 50%;
    top: -0.4rem;
    bottom: 0;
    border-left: 2px dashed color-mix(in srgb, currentColor 80%, transparent);
  }
  .you {
    position: absolute;
    left: 50%;
    top: -0.4rem;
    bottom: 0;
    width: 0;
    transition: left 0.9s var(--ease-out) 0.15s;
  }
  .grown .you {
    left: var(--x);
  }
  .you::after {
    content: '';
    position: absolute;
    left: -1.5px;
    top: 0;
    bottom: 0;
    width: 3px;
    border-radius: 2px;
    background: var(--marker, var(--hl-text));
  }
  .tag {
    position: absolute;
    bottom: 100%;
    left: 0;
    transform: translate(-50%, -2px);
    padding: 0.05rem 0.5rem;
    border-radius: 6px;
    background: var(--marker, var(--hl-text));
    color: var(--marker-ink, #1b1a2e);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.06em;
    white-space: nowrap;
  }
  .axis {
    display: flex;
    justify-content: space-between;
    font-size: 0.8rem;
    font-weight: 700;
    opacity: 0.85;
  }
  .axis span {
    display: grid;
    justify-items: center;
  }
  .axis span:first-child {
    justify-items: start;
  }
  .axis span:last-child {
    justify-items: end;
  }
  .axis small {
    font-size: 0.62rem;
    opacity: 0.75;
  }
  figcaption {
    font-size: 0.78rem;
    opacity: 0.7;
  }
</style>
