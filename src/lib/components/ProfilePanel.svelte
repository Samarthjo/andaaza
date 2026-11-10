<script lang="ts">
  import { base } from '$app/paths';
  import { istDateKey } from '$lib/core/date';
  import { formatFactor } from '$lib/core/number';
  import { computeStats, type PlayerStats } from '$lib/core/stats';
  import { allGames } from '$lib/state/storage';
  import Icon from './Icon.svelte';
  import WeekStrip from './WeekStrip.svelte';

  let { open = $bindable(false) }: { open: boolean } = $props();
  let dialog: HTMLDialogElement | undefined = $state();
  let stats = $state<PlayerStats | null>(null);
  let today = $state('');

  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) {
      today = istDateKey();
      stats = computeStats(allGames(), today);
      dialog.showModal();
    }
    if (!open && dialog.open) dialog.close();
  });
</script>

<dialog
  bind:this={dialog}
  class="sheet-dialog"
  onclose={() => (open = false)}
  onclick={(e) => {
    if (e.target === dialog) open = false;
  }}
  aria-labelledby="you-title"
>
  <div class="panel">
    <header>
      <h2 id="you-title">You</h2>
      <button class="icon-btn" onclick={() => (open = false)} aria-label="Close"><Icon name="x" size={20} /></button>
    </header>

    {#if stats && stats.played > 0}
      <div class="streak">
        <span class="flame" aria-hidden="true"><Icon name="flame" size={28} /></span>
        <p><strong class="num">{stats.currentStreak}</strong> day streak</p>
      </div>
      <dl class="mini num">
        <div><dt>Played</dt><dd>{stats.played}</dd></div>
        <div><dt>Best day</dt><dd>{stats.bestScore !== null ? formatFactor(stats.bestScore) : '–'}</dd></div>
        <div><dt>Typical</dt><dd>{stats.averageScore !== null ? formatFactor(stats.averageScore) : '–'}</dd></div>
      </dl>
      <WeekStrip {today} current={today} />
      <div class="links">
        <a class="btn" href="{base}/stats" onclick={() => (open = false)}>All stats</a>
        <a class="btn secondary" href="{base}/archive" onclick={() => (open = false)}>Archive</a>
      </div>
    {:else}
      <p class="empty">Finish a puzzle and your streak shows up here.</p>
      <a class="btn" href="{base}/play" onclick={() => (open = false)}>Play today’s puzzle</a>
    {/if}
    <p class="note">Saved in this browser only.</p>
  </div>
</dialog>

<style>
  .panel {
    padding: 1rem 1.25rem 1.5rem;
    display: grid;
    gap: 1.1rem;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h2 {
    font-size: var(--t-xl);
  }
  .streak {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    font-size: var(--t-lg);
  }
  .flame {
    display: grid;
    place-items: center;
    width: 3rem;
    height: 3rem;
    border-radius: 999px;
    background: var(--haldi);
    color: var(--deep);
  }
  .streak strong {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: var(--t-2xl);
    line-height: 1;
    margin-right: 0.2rem;
  }
  .mini {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
  }
  .mini div {
    background: var(--surface);
    border-radius: 14px;
    padding: 0.6rem 0.75rem;
    box-shadow: var(--shadow);
  }
  dt {
    font-size: var(--t-xs);
    color: var(--ink-soft);
  }
  dd {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--t-lg);
  }
  .links {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .links .btn {
    flex: 1 1 8rem;
  }
  .empty,
  .note {
    color: var(--ink-soft);
    font-size: var(--t-sm);
  }
  .note {
    font-size: var(--t-xs);
  }
</style>
