<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import { istDateKey } from '$lib/core/date';
  import { formatFactor } from '$lib/core/number';
  import { leaderboard, online, type BoardRow } from '$lib/state/online';
  import { settings } from '$lib/state/settings.svelte';

  let range = $state<'today' | 'week'>('today');
  let rows = $state<BoardRow[] | null>(null);
  let failed = $state(false);
  let nick = $state('');

  async function load() {
    rows = null;
    failed = false;
    const r = await leaderboard(range, istDateKey());
    if (r === null) failed = true;
    else rows = r;
  }

  onMount(() => {
    nick = settings.value.nickname;
    if (online) load();
  });
</script>

<svelte:head>
  <title>Andaaza leaderboard</title>
</svelte:head>

<section class="page">
  <h1>Leaderboard</h1>

  {#if !online}
    <p class="sub">The leaderboard isn’t switched on for this copy of Andaaza. Your own scores are on the <a href="{base}/stats">stats page</a>.</p>
  {:else}
    <form
      class="nick"
      onsubmit={(e) => {
        e.preventDefault();
        settings.update({ nickname: nick.trim().slice(0, 24) });
      }}
    >
      <label for="nick">Your name on the board</label>
      <div class="row">
        <input id="nick" bind:value={nick} maxlength="24" placeholder="Leave blank to stay off the board" />
        <button class="btn secondary" type="submit">Save name</button>
      </div>
      <p class="help">Applies to puzzles you finish from now on.</p>
    </form>

    <div class="filters" role="group" aria-label="Period">
      <button class="chip" aria-pressed={range === 'today'} onclick={() => ((range = 'today'), load())}>Today</button>
      <button class="chip" aria-pressed={range === 'week'} onclick={() => ((range = 'week'), load())}>Last 7 days</button>
    </div>

    {#if failed}
      <p class="sub">Couldn’t reach the leaderboard. Check your connection and <button class="link" onclick={load}>try again</button>.</p>
    {:else if rows === null}
      <p class="sub">Loading…</p>
    {:else if rows.length === 0}
      <p class="sub">No named scores yet. Finish today’s puzzle with a name set to be first.</p>
    {:else}
      <ol class="board card-list">
        {#each rows as r, i (i)}
          <li>
            <span class="rank num">{i + 1}</span>
            <span class="who">{r.nickname}</span>
            <span class="games">{range === 'week' ? `${r.games} played` : ''}</span>
            <span class="sc num">{formatFactor(r.score)}</span>
          </li>
        {/each}
      </ol>
    {/if}
  {/if}
</section>

<style>
  .page {
    max-width: 40rem;
    margin: 0 auto;
    padding: 0.75rem var(--gutter);
    display: grid;
    gap: 1rem;
  }
  h1 {
    font-size: var(--t-2xl);
  }
  .sub,
  .help {
    color: var(--ink-soft);
    font-size: var(--t-sm);
  }
  .nick {
    display: grid;
    gap: 0.4rem;
  }
  label {
    font-weight: 600;
  }
  .row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  input {
    flex: 1 1 12rem;
    min-height: 3rem;
    padding: 0 0.75rem;
    border-radius: var(--radius);
    border: 2px solid var(--rule);
    background: var(--page-2);
  }
  .filters {
    display: flex;
    gap: 0.4rem;
  }
  .link {
    background: none;
    border: none;
    padding: 0;
    text-decoration: underline;
    cursor: pointer;
  }
  .board li {
    padding-inline: 1rem;
  }
  .board li {
    display: grid;
    grid-template-columns: 2rem 1fr auto auto;
    gap: 0.75rem;
    align-items: baseline;
    padding-block: 0.65rem;
  }
  .rank {
    color: var(--ink-soft);
  }
  .games {
    font-size: var(--t-xs);
    color: var(--ink-soft);
  }
  .sc {
    font-family: var(--font-display);
    font-size: var(--t-lg);
  }
</style>
