<script lang="ts">
  import { base } from '$app/paths';
  import { formatShortDate, istDateKey, playableDates, puzzleNumber } from '$lib/core/date';
  import { formatFactor } from '$lib/core/number';
  import { fillBoard } from '$lib/core/samples';
  import { leaderboard, online, type BoardRow } from '$lib/state/online';
  import { settings } from '$lib/state/settings.svelte';
  import { loadGame } from '$lib/state/storage';
  import Icon from './Icon.svelte';
  import Sheet from './Sheet.svelte';

  let { open = $bindable(false) }: { open: boolean } = $props();

  type Cell = { key: string | null; no: number; state: 'done' | 'started' | 'todo' | 'future'; today: boolean };
  let cells = $state<Cell[]>([]);
  let played = $state(0);
  let total = $state(0);
  let board = $state<BoardRow[] | null>(null);

  $effect(() => {
    if (!open) return;
    const today = istDateKey();
    const dates = playableDates(today).reverse(); // oldest first
    total = dates.length;
    const recent = dates.slice(-28);
    const list: Cell[] = recent.map((key) => {
      const g = loadGame(key);
      return {
        key,
        no: puzzleNumber(key),
        state: g?.completed ? 'done' : g && g.guesses.length ? 'started' : 'todo',
        today: key === today
      };
    });
    played = dates.filter((k) => loadGame(k)?.completed).length;
    while (list.length % 7 !== 0 || list.length < 14) list.push({ key: null, no: 0, state: 'future', today: false });
    cells = list;
    if (!online) return;
    // Today's top three stay live while the menu is open.
    const loadBoard = () => leaderboard('today', today).then((r) => r && (board = fillBoard(r, today, 'today')));
    loadBoard();
    const timer = setInterval(() => document.visibilityState === 'visible' && loadBoard(), 10_000);
    return () => clearInterval(timer);
  });

  const pct = $derived(total ? Math.round((played / total) * 100) : 0);
  const close = () => (open = false);
</script>

<Sheet bind:open side="left" labelledby="menu-title">
  <nav class="menu" aria-label="Menu">
    <div class="top">
      <button class="icon-btn" onclick={close} aria-label="Close menu"><Icon name="x" size={22} /></button>
      <a class="brand" id="menu-title" href="{base}/" onclick={close}>Andaaza</a>
    </div>

    <section class="mcard">
      <div class="mhead">
        <Icon name="archive" size={30} stroke={1.8} />
        <h2>Archive</h2>
        <a class="more" href="{base}/archive" onclick={close}>Open the archive <span aria-hidden="true">→</span></a>
      </div>
      <div class="grid">
        {#each cells as c, i (i)}
          {#if c.key}
            <a
              class="cell {c.state}"
              class:today={c.today}
              href="{base}/play?d={c.key}"
              onclick={close}
              aria-label="No. {c.no}, {formatShortDate(c.key)}: {c.state === 'done' ? 'finished' : c.state === 'started' ? 'in progress' : 'not played'}"
              title="No. {c.no}"
            ></a>
          {:else}
            <span class="cell future" aria-hidden="true"></span>
          {/if}
        {/each}
      </div>
      <div class="progress">
        <span class="num">{played} of {total} played</span>
        <span class="track" aria-hidden="true"><span class="fill" style="width:{Math.max(pct, played ? 3 : 0)}%"></span></span>
        <span class="num pct">{pct}%</span>
      </div>
    </section>

    {#if online}
      <section class="mcard">
        <div class="mhead">
          <Icon name="trophy" size={28} stroke={1.8} />
          <h2>Leaderboard <span class="dot">·</span> Today</h2>
          <a class="more" href="{base}/leaderboard" onclick={close}>See full leaderboard <span aria-hidden="true">→</span></a>
        </div>
        {#if !settings.value.nickname}
          <p class="prompt">Add your name in the You panel to join the leaderboard.</p>
        {/if}
        {#if board && board.length}
          <ol class="board">
            {#each board.slice(0, 3) as r, i (i)}
              <li><span class="rank">{i + 1}</span><span class="who">{r.nickname}</span><span class="sc num">{formatFactor(r.score)}</span></li>
            {/each}
          </ol>
        {:else if board}
          <p class="empty">No names on today’s board yet.</p>
        {/if}
      </section>
    {/if}

    <div class="tiles">
      <a class="tile" href="{base}/submit" onclick={close}><Icon name="bulb" size={30} stroke={1.8} /><span>Submit a question</span></a>
      <a class="tile" href="https://github.com/Samarthjo/andaaza/issues/new" target="_blank" rel="noopener">
        <Icon name="message" size={30} stroke={1.8} /><span>Feedback</span>
      </a>
    </div>
  </nav>
</Sheet>

<style>
  .menu {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.1rem;
    padding: 1rem 1.25rem 2rem;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 0.5rem;
  }
  .brand {
    font-family: var(--font-display);
    font-size: 1.5rem;
    color: var(--binding);
    text-decoration: none;
    padding-right: 0.5rem;
  }
  .mcard {
    display: grid;
    gap: 1rem;
    padding: 1.25rem 1.3rem 1.3rem;
    border-radius: 24px;
    background: var(--surface);
    box-shadow: var(--shadow);
  }
  .mhead {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    column-gap: 0.75rem;
    row-gap: 0.2rem;
  }
  h2 {
    font-family: var(--font-ui);
    font-weight: 800;
    font-size: 1.45rem;
    letter-spacing: -0.01em;
  }
  .dot {
    color: var(--ink-soft);
  }
  .more {
    grid-column: 1 / -1;
    justify-self: end;
    font-weight: 700;
    font-size: var(--t-sm);
    color: var(--answer);
    text-decoration: none;
  }
  @media (min-width: 30rem) {
    .mhead {
      grid-template-columns: auto 1fr auto;
    }
    .more {
      grid-column: auto;
    }
  }
  .more:hover {
    text-decoration: underline;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
  }
  .cell {
    height: 1.9rem;
    border-radius: 8px;
    background: color-mix(in srgb, var(--ink) 11%, transparent);
    transition: transform 0.15s var(--ease-out);
  }
  a.cell:hover {
    transform: scale(1.08);
  }
  .cell.started {
    background: color-mix(in srgb, var(--haldi) 45%, transparent);
  }
  .cell.done {
    background: var(--haldi);
    box-shadow: inset 0 0 0 2px var(--deep);
  }
  .cell.today:not(.done) {
    box-shadow: inset 0 0 0 2px var(--ink);
  }
  .cell.future {
    background: color-mix(in srgb, var(--ink) 4%, transparent);
  }
  .progress {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: 0.9rem;
    font-weight: 700;
    color: var(--ink-soft);
  }
  .track {
    height: 0.55rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--ink) 11%, transparent);
    overflow: hidden;
  }
  .fill {
    display: block;
    height: 100%;
    border-radius: 999px;
    background: var(--haldi);
    transition: width 0.6s var(--ease-out);
  }
  .pct {
    color: var(--ink);
  }
  .prompt,
  .empty {
    padding: 0.85rem 1rem;
    border-radius: 14px;
    background: color-mix(in srgb, var(--ink) 6%, transparent);
    font-weight: 600;
    font-size: var(--t-sm);
  }
  .board {
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .board li {
    display: grid;
    grid-template-columns: 2rem 1fr auto;
    align-items: center;
    padding: 0.7rem 0.25rem;
    font-weight: 700;
  }
  .board li + li {
    border-top: 1px solid var(--rule);
  }
  .rank {
    color: var(--ink-soft);
  }
  .tiles {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.9rem;
  }
  .tile {
    display: grid;
    align-content: space-between;
    gap: 1.4rem;
    min-height: 8rem;
    padding: 1.25rem 1.3rem;
    border-radius: 24px;
    background: var(--surface);
    box-shadow: var(--shadow);
    text-decoration: none;
    font-weight: 800;
    font-size: 1.3rem;
    line-height: 1.15;
    transition: transform 0.2s var(--ease-out);
  }
  .tile:hover {
    transform: translateY(-2px);
  }
</style>
