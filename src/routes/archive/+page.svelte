<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { formatLongDate, istDateKey, playableDates, puzzleNumber } from '$lib/core/date';
  import { formatFactor } from '$lib/core/number';
  import { dayScore, factorOf } from '$lib/core/score';
  import { puzzleFor } from '$lib/data/puzzle';
  import { loadGame } from '$lib/state/storage';

  type Row = { key: string; no: number; score: number | null; started: boolean; emojis: string; rerun: boolean };
  type Filter = 'all' | 'played' | 'unplayed';

  let rows = $state<Row[]>([]);
  let filter = $state<Filter>('all');
  let today = $state('');

  onMount(() => {
    today = istDateKey();
    rows = playableDates(today).map((key) => {
      const g = loadGame(key);
      const p = puzzleFor(key);
      return {
        key,
        no: puzzleNumber(key),
        score: g?.completed ? dayScore(g.guesses.map((x, i) => factorOf(x, g.answers[i]))) : null,
        started: !!g && !g.completed && g.guesses.length > 0,
        emojis: p ? p.questions.map((q) => q.emoji).join(' ') : '',
        rerun: !!p?.rerun
      };
    });
  });

  const shown = $derived(
    rows.filter((r) => (filter === 'all' ? true : filter === 'played' ? r.score !== null : r.score === null))
  );
  const playedCount = $derived(rows.filter((r) => r.score !== null).length);
</script>

<svelte:head>
  <title>Archive: every Andaaza puzzle</title>
  <meta name="description" content="Play any Andaaza puzzle you missed." />
</svelte:head>

<section class="page">
  <h1>Archive</h1>
  <p class="sub">
    {#if rows.length}You’ve finished {playedCount} of {rows.length} puzzles.{/if}
    Old puzzles don’t count toward your streak.
  </p>

  <div class="filters" role="group" aria-label="Show">
    <button class="chip" aria-pressed={filter === 'all'} onclick={() => (filter = 'all')}>All</button>
    <button class="chip" aria-pressed={filter === 'played'} onclick={() => (filter = 'played')}>Finished</button>
    <button class="chip" aria-pressed={filter === 'unplayed'} onclick={() => (filter = 'unplayed')}>Not finished</button>
  </div>

  {#if rows.length && !shown.length}
    <p class="empty">
      {filter === 'played' ? 'Nothing finished yet. Start with today’s puzzle.' : 'You’ve played them all. Come back at midnight.'}
    </p>
  {/if}

  <ul class="list">
    {#each shown as r (r.key)}
      <li>
        <a href="{base}/play?d={r.key}">
          <span class="no num">No. {r.no}</span>
          <span class="when">
            {formatLongDate(r.key)}
            {#if r.key === today}<em>Today</em>{/if}
            {#if r.rerun}<em>Rerun</em>{/if}
            <span class="em" aria-hidden="true">{r.emojis}</span>
          </span>
          <span class="state num" class:done={r.score !== null}>
            {r.score !== null ? formatFactor(r.score) : r.started ? 'In progress' : 'Play'}
          </span>
        </a>
      </li>
    {/each}
  </ul>
</section>

<style>
  .page {
    padding: 0.75rem var(--gutter);
    display: grid;
    gap: 1rem;
  }
  h1 {
    font-size: var(--t-2xl);
  }
  .sub,
  .empty {
    color: var(--ink-soft);
  }
  .filters {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    border-top: 6px solid var(--binding);
  }
  .list a {
    display: grid;
    grid-template-columns: 4.5rem 1fr auto;
    gap: 0.75rem;
    align-items: center;
    padding: 0.8rem 0;
    border-bottom: 1px solid var(--rule);
    text-decoration: none;
  }
  .list a:hover .when {
    text-decoration: underline;
    text-decoration-color: var(--margin);
  }
  .no {
    font-family: var(--font-display);
    font-size: var(--t-lg);
    color: var(--binding);
  }
  .when {
    display: flex;
    flex-wrap: wrap;
    gap: 0.2rem 0.5rem;
    font-size: var(--t-sm);
  }
  .when em {
    font-style: normal;
    font-size: var(--t-xs);
    font-weight: 600;
    background: var(--page-2);
    padding: 0 0.45rem;
    border-radius: 999px;
  }
  .em {
    flex-basis: 100%;
    letter-spacing: 0.15em;
  }
  .state {
    font-weight: 600;
    font-size: var(--t-sm);
    color: var(--binding);
  }
  .state.done {
    font-family: var(--font-display);
    font-size: var(--t-lg);
    font-weight: 400;
    color: var(--ink);
  }
</style>
