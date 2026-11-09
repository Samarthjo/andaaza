<script lang="ts">
  import { onMount } from 'svelte';
  import { formatCompact, type NumberStyle } from '$lib/core/number';

  let { guess, answer, numberStyle }: { guess: number; answer: number; numberStyle: NumberStyle } = $props();

  // Log domain wide enough to show both marks with breathing room, at least 2 decades.
  const lg = $derived(Math.log10(Math.max(guess, 1e-9)));
  const la = $derived(Math.log10(answer));
  const span = $derived(Math.max(2, Math.abs(lg - la) + 1));
  const mid = $derived((lg + la) / 2);
  const lo = $derived(mid - span / 2);
  const hi = $derived(mid + span / 2);
  const x = (l: number) => ((l - lo) / (hi - lo)) * 100;

  const ticks = $derived.by(() => {
    const out: { pct: number; major: boolean; label?: string }[] = [];
    const step = span > 6 ? 2 : 1;
    for (let p = Math.floor(lo); p <= Math.ceil(hi); p++) {
      for (const m of [1, 2, 5]) {
        const l = p + Math.log10(m);
        if (l < lo || l > hi) continue;
        const major = m === 1;
        out.push({ pct: x(l), major, label: major && p % step === 0 ? formatCompact(10 ** p, numberStyle) : undefined });
      }
    }
    return out;
  });

  // The answer mark slides in from the guess: shows the gap the player was off by.
  let settled = $state(false);
  onMount(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => (settled = true)));
    return () => cancelAnimationFrame(id);
  });
</script>

<figure class="ruler" aria-label="Your guess and the answer on a scale where each step is ten times bigger">
  <div class="scale">
    {#each ticks as t, i (i)}
      <span class="tick" class:major={t.major} style="left:{t.pct}%"></span>
      {#if t.label}<span class="label num" style="left:{t.pct}%">{t.label}</span>{/if}
    {/each}
    <span class="mark you" style="left:{x(lg)}%"><span class="tag">You</span></span>
    <span class="mark ans" style="left:{settled ? x(la) : x(lg)}%"><span class="tag">Answer</span></span>
    <span
      class="gap"
      style="left:{Math.min(x(lg), settled ? x(la) : x(lg))}%;width:{Math.abs((settled ? x(la) : x(lg)) - x(lg))}%"
    ></span>
  </div>
  <figcaption class="visually-hidden">Each labelled step is ten times the previous one.</figcaption>
</figure>

<style>
  .ruler {
    margin: 0;
    padding: 1.9rem 0.75rem 0;
  }
  .scale {
    position: relative;
    height: 2.6rem;
    border-top: 2px solid var(--ink);
  }
  .tick {
    position: absolute;
    top: 0;
    width: 1px;
    height: 0.45rem;
    background: var(--ink-soft);
  }
  .tick.major {
    height: 0.85rem;
    width: 2px;
    background: var(--ink);
    transform: translateX(-1px);
  }
  .label {
    position: absolute;
    top: 1rem;
    transform: translateX(-50%);
    font-size: var(--t-xs);
    color: var(--ink-soft);
    white-space: nowrap;
  }
  .mark {
    position: absolute;
    bottom: 100%;
    width: 0;
    height: 1.4rem;
    transition: left 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .mark::after {
    content: '';
    position: absolute;
    left: -2px;
    bottom: -0.9rem;
    width: 4px;
    height: 2.3rem;
    border-radius: 2px;
  }
  .you::after {
    background: var(--ink);
  }
  .ans::after {
    background: var(--answer);
  }
  .tag {
    position: absolute;
    bottom: 1.45rem;
    transform: translateX(-50%);
    font-size: var(--t-xs);
    font-weight: 700;
    white-space: nowrap;
    padding: 0 0.35rem;
    border-radius: 4px;
  }
  .you .tag {
    background: var(--ink);
    color: var(--page);
  }
  .ans .tag {
    background: var(--answer);
    color: var(--page);
    bottom: 1.45rem;
  }
  .ans {
    z-index: 1;
  }
  .gap {
    position: absolute;
    top: -2px;
    height: 2px;
    background: var(--answer);
    transition:
      left 0.9s cubic-bezier(0.2, 0.8, 0.2, 1),
      width 0.9s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
</style>
