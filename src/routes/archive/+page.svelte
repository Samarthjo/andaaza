<script lang="ts">
  import Meta from '$lib/components/Meta.svelte';
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

  const shown = $derived(rows.filter((r) => (filter === 'all' ? true : filter === 'played' ? r.score !== null : r.score === null)));
  const playedCount = $derived(rows.filter((r) => r.score !== null).length);
</script>

<Meta title="Archive: every Andaaza puzzle" description="Play any Andaaza puzzle you missed." />

<section class="page">
  <div class="head">
    <h1>Archive</h1>
    {#if rows.length}<p class="count num">{playedCount} of {rows.length} done</p>{/if}
  </div>

  <div class="filters" role="group" aria-label="Show">
    <button class="chip" aria-pressed={filter === 'all'} onclick={() => (filter = 'all')}>All</button>
    <button class="chip" aria-pressed={filter === 'played'} onclick={() => (filter = 'played')}>Finished</button>
    <button class="chip" aria-pressed={filter === 'unplayed'} onclick={() => (filter = 'unplayed')}>Not finished</button>
  </div>

  {#if rows.length && !shown.length}
    <p class="empty">{filter === 'played' ? 'Nothing finished yet.' : 'All caught up. New one at midnight.'}</p>
  {:else}
    <ul class="card-list list">
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
              {r.score !== null ? formatFactor(r.score) : r.started ? 'Continue' : 'Play'}
            </span>
          </a>
        </li>
      {/each}
    </ul>
  {/if}
  <p class="foot">Only the daily puzzle counts toward your streak.</p>
</section>

<style>
  .page {
    max-width: 44rem;
    margin: 0 auto;
    padding: 0.75rem var(--gutter);
    display: grid;
    gap: 1rem;
  }
  .head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 1rem;
  }
  h1 {
    font-size: var(--t-2xl);
  }
  .count,
  .empty,
  .foot {
    color: var(--ink-soft);
    font-size: var(--t-sm);
  }
  .filters {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .list a {
    display: grid;
    grid-template-columns: 4.25rem 1fr auto;
    gap: 0.75rem;
    align-items: center;
    padding: 0.85rem 1rem;
    text-decoration: none;
  }
  .list a:hover {
    background: color-mix(in srgb, var(--page-2) 45%, transparent);
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
    font-weight: 700;
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
