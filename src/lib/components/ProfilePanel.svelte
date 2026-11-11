<script lang="ts">
  import { base } from '$app/paths';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { istDateKey } from '$lib/core/date';
  import { formatFactor } from '$lib/core/number';
  import { computeStats, type PlayerStats } from '$lib/core/stats';
  import { auth } from '$lib/state/auth.svelte';
  import { accountsEnabled, online } from '$lib/state/online';
  import { PALETTES, settings, type Palette } from '$lib/state/settings.svelte';
  import { allGames } from '$lib/state/storage';
  import Icon from './Icon.svelte';
  import Sheet from './Sheet.svelte';

  let { open = $bindable(false) }: { open: boolean } = $props();
  let stats = $state<PlayerStats | null>(null);
  let nick = $state('');
  let savedNick = $state(false);

  $effect(() => {
    if (!open) return;
    stats = computeStats(allGames(), istDateKey());
    nick = settings.value.nickname;
    savedNick = false;
  });

  const close = () => (open = false);
  // After logging in, people land back on the page they were on.
  const here = $derived(page.url.pathname.slice(base.length) || '/');
  const loginHref = $derived(`${base}/login?next=${encodeURIComponent(here)}`);

  function pick(id: Palette) {
    if (settings.unlocked) {
      settings.update({ palette: id });
      return;
    }
    if (id === 'haldi') return;
    auth.want(id);
    close();
    goto(loginHref);
  }
</script>

<Sheet bind:open side="right" labelledby="you-title">
  <div class="panel">
    <header>
      <span class="avatar" aria-hidden="true"><Icon name="user" size={24} /></span>
      <h2 id="you-title">{auth.signedIn && auth.name ? auth.name : 'You'}</h2>
      <button class="icon-btn close" onclick={close} aria-label="Close"><Icon name="x" size={20} /></button>
    </header>

    {#if accountsEnabled}
      {#if auth.signedIn}
        <div class="account">
          <p class="pitch">Logged in as <strong>{auth.email}</strong>. Your theme and puzzles follow you to every device.</p>
          <button class="link" onclick={() => auth.signOut()}>Log out</button>
        </div>
      {:else}
        <div class="account">
          <p class="pitch">An account unlocks colour themes, keeps your puzzles on every device and puts you on the leaderboard.</p>
          <a class="dark-pill" href={loginHref} onclick={close}>Create account or log in</a>
        </div>
      {/if}
      <hr />
    {/if}

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
        {#if !settings.unlocked}
          <a class="link lockline" href={loginHref} onclick={close}><Icon name="lock" size={18} /> Log in to unlock</a>
        {/if}
      </div>
      <div class="themes">
        {#each PALETTES as p (p.id)}
          {@const locked = !settings.unlocked && p.id !== 'haldi'}
          <button class="theme" class:is-locked={locked} aria-pressed={settings.activePalette === p.id} onclick={() => pick(p.id)}>
            <span class="dots" aria-hidden="true">
              {#each p.swatch as c (c)}<span style="background:{c}"></span>{/each}
            </span>
            {p.name}{#if locked}<span class="visually-hidden"> (locked)</span>{/if}
          </button>
        {/each}
      </div>
    </section>

    {#if online && (!accountsEnabled || auth.signedIn)}
      <hr />
      <form
        class="name"
        onsubmit={(e) => {
          e.preventDefault();
          settings.update({ nickname: nick.trim().slice(0, 24) });
          savedNick = true;
        }}
      >
        <label for="nick">Name on the leaderboard</label>
        <div class="row">
          <input id="nick" bind:value={nick} maxlength="24" placeholder="Leave blank to stay off it" oninput={() => (savedNick = false)} />
          <button class="dark-pill" type="submit">Save</button>
        </div>
        <p class="small" role="status">{savedNick ? 'Saved. It shows from your next finished puzzle.' : ''}</p>
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
  .account {
    display: grid;
    gap: 0.9rem;
    justify-items: start;
  }
  .pitch {
    font-size: 1.05rem;
    line-height: 1.55;
    color: var(--ink-soft);
  }
  .pitch strong {
    color: var(--ink);
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
  .link {
    border: none;
    background: none;
    padding: 0;
    color: var(--answer);
    font-weight: 700;
    text-decoration: none;
    cursor: pointer;
  }
  .link:hover {
    text-decoration: underline;
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
  .sechead .lockline {
    display: inline-flex;
    gap: 0.35rem;
    align-items: center;
    color: var(--ink-soft);
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
  .theme.is-locked {
    opacity: 0.55;
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
