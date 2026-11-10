<script lang="ts">
  import { base } from '$app/paths';
  import { istDateKey } from '$lib/core/date';
  import { formatFactor } from '$lib/core/number';
  import { computeStats, type PlayerStats } from '$lib/core/stats';
  import { online } from '$lib/state/online';
  import { settings } from '$lib/state/settings.svelte';
  import { allGames } from '$lib/state/storage';
  import Icon from './Icon.svelte';
  import Sheet from './Sheet.svelte';
  import WeekStrip from './WeekStrip.svelte';

  let { open = $bindable(false) }: { open: boolean } = $props();
  let stats = $state<PlayerStats | null>(null);
  let today = $state('');
  let nick = $state('');
  let saved = $state(false);

  $effect(() => {
    if (!open) return;
    today = istDateKey();
    stats = computeStats(allGames(), today);
    nick = settings.value.nickname;
    saved = false;
  });

  const close = () => (open = false);
</script>

<Sheet bind:open side="right" labelledby="you-title">
  <div class="panel">
    <header>
      <h2 id="you-title">You</h2>
      <button class="icon-btn" onclick={close} aria-label="Close"><Icon name="x" size={20} /></button>
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
      <a class="btn secondary" href="{base}/stats" onclick={close}>All my stats</a>
    {:else}
      <p class="empty">Finish a puzzle and your streak shows up here.</p>
    {/if}

    {#if online}
      <form
        class="name"
        onsubmit={(e) => {
          e.preventDefault();
          settings.update({ nickname: nick.trim().slice(0, 24) });
          saved = true;
        }}
      >
        <label for="nick">Name on the leaderboard</label>
        <div class="row">
          <input id="nick" bind:value={nick} maxlength="24" placeholder="Leave blank to stay off it" oninput={() => (saved = false)} />
          <button class="btn" type="submit">Save</button>
        </div>
        <p class="help" role="status">{saved ? 'Saved. It shows from your next finished puzzle.' : ''}</p>
      </form>
    {/if}
    <p class="note">Your games are saved in this browser.</p>
  </div>
</Sheet>

<style>
  .panel {
    padding: 1rem 1.25rem 1.6rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
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
    font-weight: 800;
    font-size: var(--t-2xl);
    line-height: 1;
    margin-right: 0.2rem;
  }
  .mini {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.5rem;
  }
  .mini div {
    background: var(--surface);
    border-radius: 16px;
    padding: 0.6rem 0.75rem;
    box-shadow: var(--shadow);
  }
  dt {
    font-size: var(--t-xs);
    color: var(--ink-soft);
  }
  dd {
    margin: 0;
    font-weight: 800;
    font-size: var(--t-lg);
  }
  .btn.secondary {
    justify-self: start;
  }
  .name {
    display: grid;
    gap: 0.4rem;
  }
  label {
    font-weight: 700;
    font-size: var(--t-sm);
  }
  .row {
    display: flex;
    gap: 0.5rem;
  }
  input {
    flex: 1;
    min-width: 0;
    width: 0;
    min-height: 3rem;
    padding: 0 0.85rem;
    border-radius: 14px;
    border: 2px solid var(--rule);
    background: var(--surface);
  }
  .empty,
  .help,
  .note {
    color: var(--ink-soft);
    font-size: var(--t-sm);
  }
  .note {
    font-size: var(--t-xs);
  }
</style>
