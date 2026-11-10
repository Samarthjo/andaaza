<script lang="ts">
  import { tick } from 'svelte';
  import { slide } from 'svelte/transition';
  import { base } from '$app/paths';
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
  let showLogin = $state(false);
  let email = $state('');
  let sending = $state(false);
  let sentTo = $state('');
  let error = $state('');
  let hint = $state('');
  let nick = $state('');
  let savedNick = $state(false);
  let emailInput: HTMLInputElement | undefined = $state();

  $effect(() => {
    if (!open) return;
    stats = computeStats(allGames(), istDateKey());
    nick = settings.value.nickname;
    savedNick = false;
    hint = '';
  });

  const close = () => (open = false);
  const validEmail = $derived(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()));

  async function openLogin() {
    showLogin = true;
    error = '';
    await tick();
    emailInput?.focus();
  }

  async function send(e: Event) {
    e.preventDefault();
    if (!validEmail || sending) return;
    sending = true;
    error = '';
    const err = await auth.sendLink(email.trim());
    sending = false;
    if (err) error = err;
    else sentTo = email.trim();
  }

  function pick(id: Palette) {
    if (!settings.unlocked) {
      hint = 'Sign in to unlock colour themes.';
      if (accountsEnabled) openLogin();
      return;
    }
    settings.update({ palette: id });
  }
</script>

<Sheet bind:open side="right" labelledby="you-title">
  <div class="panel">
    <header>
      <span class="avatar" aria-hidden="true"><Icon name="user" size={24} /></span>
      <h2 id="you-title">You</h2>
      <button class="icon-btn close" onclick={close} aria-label="Close"><Icon name="x" size={20} /></button>
    </header>

    {#if accountsEnabled}
      {#if auth.signedIn}
        <div class="account">
          <p class="pitch">Signed in as <strong>{auth.email}</strong>. Your puzzles sync to every device you sign in on.</p>
          <button class="link" onclick={() => auth.signOut()}>Log out</button>
        </div>
      {:else}
        <div class="account">
          <p class="pitch">
            An account keeps your finished puzzles on every device, puts you on the leaderboard and unlocks colour themes.
          </p>
          {#if sentTo}
            <p class="sent" role="status">
              <Icon name="mail" size={20} />
              <span>Check your inbox at <strong>{sentTo}</strong>. The link signs you in.</span>
            </p>
          {:else if !showLogin}
            <button class="dark-pill" onclick={openLogin}>Create account or log in</button>
          {:else}
            <form class="login" onsubmit={send} transition:slide={{ duration: 220 }}>
              <label for="login-email">Email</label>
              <div class="row">
                <input
                  bind:this={emailInput}
                  id="login-email"
                  type="email"
                  autocomplete="email"
                  inputmode="email"
                  placeholder="you@example.com"
                  bind:value={email}
                />
                <button class="dark-pill" type="submit" disabled={!validEmail || sending}>{sending ? 'Sending…' : 'Send link'}</button>
              </div>
              <p class="small">No password. We email you a link that signs you in.</p>
              {#if error}<p class="err" role="alert">{error}</p>{/if}
            </form>
          {/if}
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
          <button class="link lockline" onclick={openLogin}><Icon name="lock" size={18} /> Sign in to unlock</button>
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
      {#if hint}<p class="small" role="status">{hint}</p>{/if}
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
  .dark-pill[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
  .login,
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
  .sent {
    display: flex;
    gap: 0.6rem;
    align-items: flex-start;
    overflow-wrap: anywhere;
    padding: 0.85rem 1rem;
    border-radius: 14px;
    background: var(--surface);
    box-shadow: var(--shadow);
    font-size: var(--t-sm);
  }
  .small {
    font-size: var(--t-xs);
    color: var(--ink-soft);
  }
  .err {
    font-size: var(--t-sm);
    color: var(--bad);
  }
  .link {
    border: none;
    background: none;
    padding: 0;
    color: var(--answer);
    font-weight: 700;
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
  .lockline {
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
