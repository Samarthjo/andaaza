<script lang="ts">
  import Meta from '$lib/components/Meta.svelte';
  import { onMount } from 'svelte';
  import { fade } from 'svelte/transition';
  import { base } from '$app/paths';
  import { istDateKey } from '$lib/core/date';
  import { formatFactor } from '$lib/core/number';
  import { fillBoard, fillCounts, sampleScoreCounts, scoreSpread, SPREAD_LABELS, type BoardEntry, type BoardRange } from '$lib/core/samples';
  import { nameToday } from '$lib/state/game';
  import { leaderboard, online, puzzleStats, streaks } from '$lib/state/online';
  import { settings } from '$lib/state/settings.svelte';

  const TABS: { id: BoardRange; label: string; sub: string }[] = [
    { id: 'today', label: 'Today', sub: 'Today’s top guessers.' },
    { id: 'week', label: '7 days', sub: 'Best average over the last 7 days (3+ days played).' },
    { id: 'all', label: 'All time', sub: 'Best average ever (3+ days played).' },
    { id: 'streaks', label: 'Streaks', sub: 'Longest daily streaks going right now.' }
  ];

  let range = $state<BoardRange>('today');
  let rows = $state<BoardEntry[] | null>(null);
  let spread = $state<number[] | null>(null);
  let failed = $state(false);
  let today = $state('');
  let editing = $state(false);
  let nick = $state('');

  const tab = $derived(TABS.find((t) => t.id === range) ?? TABS[0]);
  const hasSamples = $derived(rows?.some((r) => r.sample) ?? false);
  const me = $derived(settings.value.nickname);
  const maxPct = $derived(spread ? Math.max(1, ...spread) : 1);

  /** How often an open board checks for new players and names. */
  const LIVE_MS = 10_000;
  let seq = 0;
  let ticks = 0;

  /** Fetch the open tab. A quiet load (the live refresh) keeps the current rows up until new ones arrive. */
  async function load(quiet = false) {
    const r = range;
    const mine = ++seq;
    if (!quiet) {
      rows = null;
      failed = false;
    }
    const real: BoardEntry[] | null =
      r === 'streaks'
        ? ((await streaks(today))?.map((x) => ({ nickname: x.nickname, score: x.streak, games: 0 })) ?? null)
        : await leaderboard(r, today);
    if (mine !== seq) return; // a newer load (another tab, a new name) is on its way
    if (real === null) {
      if (!quiet) failed = true;
      return;
    }
    rows = fillBoard(real, today, r);
    failed = false;
  }

  async function loadSpread(quiet = false) {
    const stats = await puzzleStats(today);
    if (!stats && quiet && spread) return;
    spread = scoreSpread(fillCounts(stats?.scores ?? null, (n) => sampleScoreCounts(today, n)));
  }

  /** Live refresh while the page is on screen; rolls over to the new puzzle at midnight in India. */
  function live() {
    if (document.visibilityState !== 'visible') return;
    const now = istDateKey();
    if (now !== today) {
      today = now;
      load();
      loadSpread();
      return;
    }
    load(true);
    if (++ticks % 3 === 0) loadSpread(true);
  }

  function pick(id: BoardRange) {
    if (id === range) return;
    range = id;
    load();
  }

  async function saveName(e: SubmitEvent) {
    e.preventDefault();
    const name = nick.trim().slice(0, 24);
    settings.update({ nickname: name });
    editing = false;
    // Already played today? Put that game on the board under the new name before reloading it.
    if (name) await nameToday(name, today);
    load(true);
  }

  onMount(() => {
    today = istDateKey();
    if (!online) return;
    load();
    loadSpread();
    const timer = setInterval(live, LIVE_MS);
    document.addEventListener('visibilitychange', live);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', live);
    };
  });
</script>

<Meta title="Andaaza leaderboard" description="Today’s top guessers, the best averages and the longest streaks in Andaaza, the daily estimation game for India." />

<section class="board">
  <h1>Leaderboard</h1>
  <p class="sub">
    {tab.sub}
    {#if online}<span class="live" title="New players and names show up by themselves"><span class="pulse" aria-hidden="true"></span>Live</span>{/if}
  </p>

  {#if !online}
    <p class="sub">The leaderboard isn’t switched on for this copy of Andaaza. Your own scores are on the <a href="{base}/stats">stats page</a>.</p>
  {:else}
    <div class="tabs" role="tablist" aria-label="Leaderboard">
      {#each TABS as t (t.id)}
        <button role="tab" aria-selected={range === t.id} class="tab" class:on={range === t.id} onclick={() => pick(t.id)}>{t.label}</button>
      {/each}
    </div>

    <div class="banner">
      {#if editing}
        <form class="namebox" onsubmit={saveName}>
          <label class="visually-hidden" for="nick">Your name on the board</label>
          <input id="nick" bind:value={nick} maxlength="24" placeholder="Leave blank to stay off it" />
          <button class="yellow" type="submit">Save</button>
        </form>
      {:else}
        <p>
          {#if settings.value.nickname}You’re on the board as <strong>{settings.value.nickname}</strong>.{:else}Add a name to join the leaderboard.{/if}
        </p>
        <button class="yellow" onclick={() => ((nick = settings.value.nickname), (editing = true))}>
          {settings.value.nickname ? 'Change name' : 'Add name'}
        </button>
      {/if}
    </div>

    {#if range === 'today' && spread}
      <figure class="spread" in:fade={{ duration: 200 }}>
        <figcaption class="lbl">Today’s scores</figcaption>
        <div class="bars" aria-hidden="true">
          {#each spread as pct, i (i)}
            <div class="col">
              <span class="pct num">{pct}%</span>
              <span class="bar" style="--h:{(pct / maxPct) * 100}%"></span>
            </div>
          {/each}
        </div>
        <div class="axis num" aria-hidden="true">
          {#each SPREAD_LABELS as l (l)}<span>{l}</span>{/each}
        </div>
        <p class="visually-hidden">
          {SPREAD_LABELS.map((l, i) => `${l}: ${spread?.[i]}%`).join(', ')}
        </p>
      </figure>
    {/if}

    {#if failed}
      <p class="sub">Couldn’t reach the leaderboard. Check your connection and <button class="link" onclick={() => load()}>try again</button>.</p>
    {:else if rows === null}
      <p class="sub">Loading…</p>
    {:else if rows.length === 0}
      <p class="sub">Nobody has played 3 days yet. This board fills up from the third puzzle.</p>
    {:else}
      <div class="table" in:fade={{ duration: 200 }}>
        <div class="head lbl" aria-hidden="true">
          <span>Rank</span><span>Player</span><span>{range === 'streaks' ? 'Days' : 'Score'}</span>
        </div>
        <ol>
          {#each rows as r, i (i)}
            <li class:me={!r.sample && me && r.nickname === me}>
              <span class="rank num">{i + 1}</span>
              <span class="who">
                {r.nickname}
                {#if range === 'week' || range === 'all'}<small>{r.games} days</small>{/if}
              </span>
              <span class="sc num">{range === 'streaks' ? r.score : formatFactor(r.score)}</span>
            </li>
          {/each}
        </ol>
      </div>
      {#if hasSamples}<p class="note">Sample players fill the board until more people play.</p>{/if}
    {/if}
  {/if}
</section>

<style>
  .board {
    max-width: 48rem;
    margin: 0 auto;
    display: grid;
    gap: 1.25rem;
  }
  h1 {
    font-family: var(--font-ui);
    font-weight: 800;
    font-size: clamp(3.2rem, 13vw, 6rem);
    line-height: 0.95;
    letter-spacing: -0.05em;
    margin-top: 0.5rem;
  }
  .sub {
    color: var(--ink-soft);
    font-size: 1.25rem;
    margin-top: -0.25rem;
  }
  .live {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    margin-left: 0.5rem;
    padding: 0.2rem 0.65rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--answer) 12%, transparent);
    color: var(--answer);
    font-family: var(--font-ui);
    font-size: 0.72rem;
    font-weight: 800;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    vertical-align: 0.2em;
  }
  .pulse {
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: currentColor;
    animation: pulse 1.6s ease-in-out infinite;
  }
  @keyframes pulse {
    50% {
      opacity: 0.25;
      transform: scale(0.7);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .pulse {
      animation: none;
    }
  }
  .tabs {
    display: flex;
    gap: 0.6rem;
    overflow-x: auto;
    scrollbar-width: none;
    padding: 0.25rem 0;
  }
  .tabs::-webkit-scrollbar {
    display: none;
  }
  .tab {
    flex: none;
    min-height: 2.9rem;
    padding: 0 1.4rem;
    border: none;
    border-radius: 999px;
    background: var(--surface);
    color: var(--ink);
    font-weight: 800;
    font-size: 0.92rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
    transition:
      background-color 0.2s ease,
      color 0.2s ease;
  }
  .tab.on {
    background: #1b1a2e;
    color: #fff;
  }
  .banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
    padding: 1.4rem 1.6rem;
    border-radius: 24px;
    background: #1b1a2e;
    color: #fff;
    font-weight: 700;
    font-size: 1.15rem;
  }
  .banner strong {
    color: var(--haldi);
  }
  .yellow {
    display: inline-flex;
    align-items: center;
    min-height: 2.9rem;
    padding: 0 1.4rem;
    border: none;
    border-radius: 999px;
    background: var(--haldi);
    color: #1b1a2e;
    font-weight: 800;
    font-size: 1.05rem;
    text-decoration: none;
    cursor: pointer;
    transition: transform 0.2s var(--ease-out);
  }
  .yellow:hover {
    transform: translateY(-1px);
  }
  .namebox {
    display: flex;
    gap: 0.6rem;
    width: 100%;
  }
  .namebox input {
    flex: 1;
    min-width: 0;
    width: 0;
    min-height: 2.9rem;
    padding: 0 1rem;
    border: none;
    border-radius: 14px;
    background: #fff;
    color: #1b1a2e;
    font-size: 1.05rem;
  }
  .spread {
    margin: 0;
    padding: 1.5rem 1.6rem 1.2rem;
    border-radius: 24px;
    background: var(--surface);
    box-shadow: var(--shadow);
    display: grid;
    gap: 1rem;
  }
  .spread .lbl {
    color: var(--ink-soft);
  }
  .bars {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: clamp(0.3rem, 1.4vw, 0.75rem);
    height: 11rem;
    align-items: end;
  }
  .col {
    display: grid;
    grid-template-rows: auto 1fr;
    align-items: end;
    justify-items: stretch;
    height: 100%;
  }
  .pct {
    justify-self: center;
    margin-bottom: 0.35rem;
    font-weight: 700;
    font-size: clamp(0.72rem, 2.4vw, 0.95rem);
    color: var(--ink-soft);
  }
  .bar {
    height: max(6px, var(--h));
    transition: height 0.5s var(--ease-out);
    border-radius: 8px;
    background: var(--card-q1);
    transform-origin: bottom;
    animation: grow 0.7s var(--ease-out) both;
  }
  @keyframes grow {
    from {
      transform: scaleY(0);
    }
  }
  .axis {
    display: grid;
    grid-template-columns: repeat(8, minmax(0, 1fr));
    gap: clamp(0.3rem, 1.4vw, 0.75rem);
    text-align: center;
    color: var(--ink-soft);
    font-size: clamp(0.68rem, 2.2vw, 0.88rem);
    font-weight: 700;
    letter-spacing: 0.04em;
  }
  .table {
    display: grid;
    gap: 0.4rem;
  }
  .head,
  li {
    display: grid;
    grid-template-columns: 4.5rem minmax(0, 1fr) auto;
    align-items: center;
    gap: 0.75rem;
    padding: 0 1.6rem;
  }
  .head {
    color: var(--ink-soft);
    padding-top: 0.4rem;
  }
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    border-radius: 22px;
    background: var(--surface);
    box-shadow: var(--shadow);
    overflow: hidden;
  }
  li {
    min-height: 4.4rem;
    font-size: 1.15rem;
  }
  li + li {
    border-top: 1px solid var(--rule);
  }
  li.me {
    background: color-mix(in srgb, var(--haldi) 28%, transparent);
  }
  .rank {
    color: var(--ink-soft);
    font-weight: 700;
  }
  .who {
    font-weight: 700;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .who small {
    margin-left: 0.5rem;
    color: var(--ink-soft);
    font-weight: 600;
    font-size: 0.85rem;
  }
  .sc {
    font-weight: 800;
    font-size: 1.3rem;
  }
  .note {
    color: var(--ink-soft);
    font-size: 0.85rem;
    text-align: center;
  }
  .link {
    border: none;
    background: none;
    padding: 0;
    color: var(--answer);
    font: inherit;
    font-weight: 700;
    cursor: pointer;
  }
  @media (max-width: 30rem) {
    .head,
    li {
      grid-template-columns: 2.5rem minmax(0, 1fr) auto;
      padding: 0 1.1rem;
    }
    .banner {
      padding: 1.2rem 1.25rem;
    }
  }
</style>
