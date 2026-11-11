<script lang="ts">
  import { base } from '$app/paths';
  import { istDateKey } from '$lib/core/date';
  import { formatFactor } from '$lib/core/number';
  import { computeStats, type PlayerStats } from '$lib/core/stats';
  import { nameToday } from '$lib/state/game';
  import { online } from '$lib/state/online';
  import { PALETTES, settings } from '$lib/state/settings.svelte';
  import { allGames } from '$lib/state/storage';
  import Icon from './Icon.svelte';
  import Sheet from './Sheet.svelte';

  let { open = $bindable(false) }: { open: boolean } = $props();
  let stats = $state<PlayerStats | null>(null);
  let nick = $state('');
  let saved = $state('');

  $effect(() => {
    if (!open) return;
    stats = computeStats(allGames(), istDateKey());
    nick = settings.value.nickname;
    saved = '';
  });

  const close = () => (open = false);

  async function saveName(e: SubmitEvent) {
    e.preventDefault();
    const name = nick.trim().slice(0, 24);
    settings.update({ nickname: name });
    if (!name) {
      saved = 'Saved. You stay off the leaderboard from your next puzzle.';
      return;
    }
    saved = 'Saved.';
    if (await nameToday(name, istDateKey())) saved = 'Saved. You’re on today’s leaderboard.';
    else saved = 'Saved. It shows from your next finished puzzle.';
  }
</script>

<Sheet bind:open side="right" labelledby="you-title">
  <div class="panel">
    <header>
      <span class="avatar" aria-hidden="true"><Icon name="user" size={24} /></span>
      <h2 id="you-title">{settings.value.nickname || 'You'}</h2>
      <button class="icon-btn close" onclick={close} aria-label="Close"><Icon name="x" size={20} /></button>
    </header>

    <section aria-labelledby="stats-h">
      <div class="sechead">
        <h3 id="stats-h" class="lbl">Stats</h3>
        <a href="{base}/stats" onclick={close}>See full stats <span aria-hidden="true">→</span></a>
      </div>
      <dl class="tiles num">
        <div><dd>{stats?.played ?? 0}</dd><dt>Played</dt></div>
        <div><dd>{stats?.currentStreak ?? 0}</dd><dt>Day streak</dt></div>
        <div><dd>{stats?.averageScore ? formatFactor(stats.averageScore) : '–'}</dd><dt>Average multiple</dt></div>
        <div><dd>{stats?.bestScore ? formatFactor(stats.bestScore) : '–'}</dd><dt>Best day</dt></div>
      </dl>
    </section>

    <hr />

    <section aria-labelledby="theme-h">
      <div class="sechead">
        <h3 id="theme-h" class="lbl">Theme</h3>
      </div>
      <div class="themes">
        {#each PALETTES as p (p.id)}
          <button class="theme" aria-pressed={settings.value.palette === p.id} onclick={() => settings.update({ palette: p.id })}>
            <span class="dots" aria-hidden="true">
              {#each p.swatch as c (c)}<span style="background:{c}"></span>{/each}
            </span>
            {p.name}
          </button>
        {/each}
      </div>
    </section>

    {#if online}
      <hr />
      <form class="name" onsubmit={saveName}>
        <label for="nick">Name on the leaderboard</label>
        <div class="row">
          <input id="nick" bind:value={nick} maxlength="24" placeholder="Leave blank to stay off it" oninput={() => (saved = '')} />
          <button class="dark-pill" type="submit">Save</button>
        </div>
        <p class="small" role="status">{saved}</p>
      </form>
    {/if}
  </div>
</Sheet>

<style>
  .panel {
    padding: 1.25rem 1.4rem 1.8rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;
  }
  header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .avatar {
    display: grid;
    place-items: center;
    width: 3.4rem;
    height: 3.4rem;
    border-radius: 999px;
    background: var(--deep);
    color: var(--haldi);
    flex: none;
  }
  h2 {
    font-family: var(--font-ui);
    font-weight: 800;
    font-size: 2rem;
    letter-spacing: -0.02em;
  }
  .close {
    margin-left: auto;
  }
  .dark-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    text-decoration: none;
    min-height: 3rem;
    padding: 0 1.4rem;
    border: none;
    border-radius: 999px;
    background: var(--deep);
    color: var(--haldi);
    font-weight: 800;
    font-size: 1rem;
    cursor: pointer;
    white-space: nowrap;
    transition:
      transform 0.2s var(--ease-out),
      opacity 0.2s ease;
  }
  .dark-pill:hover {
    transform: translateY(-1px);
  }
  .dark-pill:active {
    transform: scale(0.97);
  }
  .name {
    display: grid;
    gap: 0.45rem;
    width: 100%;
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
    padding: 0 0.9rem;
    border-radius: 14px;
    border: 2px solid var(--rule);
    background: var(--surface);
  }
  input:focus {
    border-color: var(--binding);
    outline: none;
  }
  .small {
    font-size: var(--t-xs);
    color: var(--ink-soft);
  }
  hr {
    border: none;
    border-top: 1px solid var(--rule);
    margin: 0;
  }
  section {
    display: grid;
    gap: 0.8rem;
  }
  .sechead {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;
  }
  .sechead .lbl {
    font-size: 0.95rem;
    color: var(--ink-soft);
  }
  .sechead a {
    color: var(--answer);
    font-weight: 700;
    text-decoration: none;
  }
  .sechead a:hover {
    text-decoration: underline;
  }
  .tiles {
    margin: 0;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
  }
  .tiles div {
    display: flex;
    flex-direction: column-reverse;
    justify-content: flex-end;
    padding: 0.9rem 1rem;
    border-radius: 18px;
    background: var(--surface);
    box-shadow: var(--shadow);
  }
  dd {
    margin: 0;
    font-weight: 800;
    font-size: 1.9rem;
    line-height: 1.05;
  }
  dt {
    font-weight: 600;
    color: var(--ink-soft);
  }
  .themes {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.6rem;
  }
  .theme {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    min-height: 3.3rem;
    padding: 0 1rem;
    border-radius: 16px;
    border: 2px solid var(--rule);
    background: transparent;
    font-weight: 700;
    font-size: 1.05rem;
    cursor: pointer;
    transition:
      border-color 0.2s ease,
      transform 0.2s var(--ease-out),
      opacity 0.2s ease;
  }
  .theme:hover {
    transform: translateY(-1px);
  }
  .theme[aria-pressed='true'] {
    border-color: var(--ink-soft);
    background: var(--surface);
  }
  .dots {
    display: inline-flex;
  }
  .dots span {
    width: 1.1rem;
    height: 1.1rem;
    border-radius: 999px;
    border: 1.5px solid var(--page);
  }
  .dots span + span {
    margin-left: -0.35rem;
  }
</style>
