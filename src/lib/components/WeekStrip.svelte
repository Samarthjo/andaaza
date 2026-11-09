<script lang="ts">
  import { base } from '$app/paths';
  import { addDays, formatWeekday, LAUNCH_DATE, daysBetween } from '$lib/core/date';
  import { formatFactor } from '$lib/core/number';
  import { dayScore, factorOf } from '$lib/core/score';
  import { loadGame } from '$lib/state/storage';

  let { today, current }: { today: string; current: string } = $props();

  const days = $derived(
    Array.from({ length: 7 }, (_, i) => addDays(today, i - 6))
      .filter((k) => daysBetween(LAUNCH_DATE, k) >= 0)
      .map((k) => {
        const g = loadGame(k);
        const done = g?.completed ? dayScore(g.guesses.map((x, i) => factorOf(x, g.answers[i]))) : null;
        return { k, done, started: !!g && !g.completed };
      })
  );
</script>

<nav class="week" aria-label="This week">
  {#each days as d (d.k)}
    <a
      href="{base}/play?d={d.k}"
      class:done={d.done !== null}
      class:current={d.k === current}
      aria-label="{formatWeekday(d.k)}: {d.done !== null ? `scored ${formatFactor(d.done)}` : d.started ? 'in progress' : 'not played'}"
    >
      <span class="wd">{formatWeekday(d.k)}</span>
      <span class="sc num">{d.done !== null ? formatFactor(d.done) : d.started ? '…' : '–'}</span>
    </a>
  {/each}
</nav>

<style>
  .week {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.3rem;
  }
  a {
    display: grid;
    justify-items: center;
    gap: 0.1rem;
    padding: 0.45rem 0.1rem;
    border-radius: 8px;
    border: 1.5px dashed var(--rule);
    text-decoration: none;
    min-width: 0;
  }
  a.done {
    border-style: solid;
    background: var(--page-2);
  }
  a.current {
    border-color: var(--binding);
  }
  .wd {
    font-size: var(--t-xs);
    color: var(--ink-soft);
  }
  .sc {
    font-size: 0.8rem;
    font-weight: 600;
    white-space: nowrap;
  }
</style>
