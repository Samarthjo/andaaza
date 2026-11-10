<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Calculator from '$lib/components/Calculator.svelte';
  import GuessInput from '$lib/components/GuessInput.svelte';
  import Results from '$lib/components/Results.svelte';
  import Reveal from '$lib/components/Reveal.svelte';
  import { daysBetween, formatLongDate, isDateKey, istDateKey } from '$lib/core/date';
  import { formatFactor } from '$lib/core/number';
  import { emojiFor, factorOf } from '$lib/core/score';
  import { puzzleFor, type Puzzle } from '$lib/data/puzzle';
  import { finishGame, lockGuess, openGame } from '$lib/state/game';
  import { online, puzzleStats, type PuzzleStats } from '$lib/state/online';
  import { settings } from '$lib/state/settings.svelte';
  import type { SavedGame } from '$lib/state/storage';

  type View = { phase: 'guess' | 'reveal'; idx: number } | { phase: 'results' };

  let today = $state('');
  let puzzle = $state<Puzzle | null>(null);
  let game = $state<SavedGame | null>(null);
  let view = $state<View>({ phase: 'guess', idx: 0 });
  let stats = $state<PuzzleStats | null>(null);
  let calcOpen = $state(false);
  let draft = $state('');
  let notice = $state('');
  let ready = $state(false);

  const numberStyle = $derived(settings.value.numberStyle);
  const isToday = $derived(puzzle?.dateKey === today);

  onMount(() => {
    today = istDateKey();
    const params = new URLSearchParams(location.search);
    const requested = params.get('d');
    let key = today;
    if (requested && isDateKey(requested)) {
      if (daysBetween(requested, today) < 0) notice = 'That puzzle isn’t out yet. Here’s today’s.';
      else if (!puzzleFor(requested)) notice = 'Andaaza started after that date. Here’s today’s.';
      else key = requested;
    }
    const p = puzzleFor(key);
    if (!p) {
      ready = true;
      return;
    }
    puzzle = p;
    game = openGame(p, today);
    const r = Number(params.get('r'));
    if (game.completed) view = { phase: 'results' };
    else if (params.has('r') && Number.isInteger(r) && r >= 0 && r < game.guesses.length) view = { phase: 'reveal', idx: r };
    else view = { phase: 'guess', idx: game.guesses.length };
    ready = true;
    refreshStats();
  });

  async function refreshStats() {
    if (!online || !puzzle) return;
    stats = await puzzleStats(puzzle.dateKey);
  }

  function lock(guess: number) {
    if (!puzzle || !game || view.phase !== 'guess' || game.guesses.length !== view.idx) return;
    const next = lockGuess(puzzle, game, guess);
    if (!next) return;
    game = next;
    draft = '';
    view = { phase: 'reveal', idx: next.guesses.length - 1 };
    scrollTop();
    if (online) setTimeout(refreshStats, 600);
  }

  function next() {
    if (!puzzle || !game || view.phase !== 'reveal') return;
    const n = view.idx + 1;
    if (n < game.guesses.length) view = { phase: 'reveal', idx: n };
    else if (n < puzzle.questions.length) view = { phase: 'guess', idx: n };
    else {
      game = finishGame(puzzle, game, settings.value.nickname);
      view = { phase: 'results' };
      if (online) setTimeout(refreshStats, 600);
    }
    scrollTop();
  }

  function goTo(i: number) {
    if (!game) return;
    if (i < game.guesses.length) view = { phase: 'reveal', idx: i };
    else if (i === game.guesses.length && !game.completed) view = { phase: 'guess', idx: i };
    scrollTop();
  }

  async function scrollTop() {
    await tick();
    document.getElementById('sheet')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function nextLabel(idx: number): string {
    if (!game || !puzzle) return 'Next';
    const last = idx + 1 >= puzzle.questions.length;
    if (game.completed) return last ? 'Back to my total' : `Next: question ${idx + 2}`;
    return last ? 'See my total' : `On to question ${idx + 2}`;
  }
</script>

<svelte:head>
  <title>{puzzle ? `Andaaza No. ${puzzle.number}` : 'Play Andaaza'}</title>
  <meta name="description" content="Three questions about India, one guess each. How close can you get?" />
</svelte:head>

<div class="wrap">
  {#if !ready}
    <p class="loading">Loading…</p>
  {:else if !puzzle || !game}
    <section class="empty">
      <h1>The first puzzle isn’t out yet</h1>
    </section>
  {:else}
    {#if notice}<p class="notice" role="status">{notice}</p>{/if}

    <div class="meta">
      <h1 class="no">No. {puzzle.number}</h1>
      <p class="date">
        {formatLongDate(puzzle.dateKey)}
        {#if !isToday}<span class="tag">Archive</span>{/if}
        {#if puzzle.rerun}<span class="tag">Rerun</span>{/if}
      </p>
    </div>

    <ol class="steps" aria-label="Questions">
      {#each puzzle.questions as q, i (q.id)}
        {@const answered = i < game.guesses.length}
        {@const active = view.phase !== 'results' && view.idx === i}
        <li>
          <button
            class="step"
            class:answered
            class:active
            disabled={!answered && !(i === game.guesses.length && !game.completed)}
            aria-current={active ? 'step' : undefined}
            onclick={() => goTo(i)}
          >
            <span class="sn">Q{i + 1}</span>
            {#if answered}
              <span class="sf num">{emojiFor(factorOf(game.guesses[i], q.answer))} {formatFactor(factorOf(game.guesses[i], q.answer))}</span>
            {/if}
          </button>
        </li>
      {/each}
      {#if game.completed}
        <li>
          <button class="step total" class:active={view.phase === 'results'} onclick={() => (view = { phase: 'results' })}>
            Total
          </button>
        </li>
      {/if}
    </ol>

    <article id="sheet" class="sheet surface">
      {#if view.phase === 'guess'}
        {@const q = puzzle.questions[view.idx]}
        {#key q.id}
          <div class="ask">
            <p class="qmeta"><span aria-hidden="true">{q.emoji}</span> Question {view.idx + 1} of {puzzle.questions.length}</p>
            <h2 class="prompt">{q.prompt}</h2>
            <GuessInput question={q} {numberStyle} bind:prefill={draft} onlock={lock} oncalc={() => (calcOpen = true)} />
          </div>
        {/key}
      {:else if view.phase === 'reveal'}
        {@const idx = view.idx}
        {#key idx}
          <Reveal
            question={puzzle.questions[idx]}
            guess={game.guesses[idx]}
            {numberStyle}
            crowd={stats?.buckets?.[idx] ?? null}
            nextLabel={nextLabel(idx)}
            onnext={next}
          />
        {/key}
      {:else}
        <Results
          {puzzle}
          guesses={game.guesses}
          {isToday}
          {today}
          {numberStyle}
          scoreCrowd={stats?.scores ?? null}
          onreview={(i) => (view = { phase: 'reveal', idx: i })}
        />
      {/if}
    </article>

    <Calculator bind:open={calcOpen} dateKey={puzzle.dateKey} {numberStyle} onuse={(v) => (draft = v)} />
  {/if}
</div>

<style>
  .wrap {
    max-width: 44rem;
    margin: 0 auto;
    padding: 0.5rem var(--gutter) 1rem;
  }
  .loading,
  .empty {
    padding: 1rem 0;
  }
  .notice {
    background: var(--surface);
    border-radius: var(--radius);
    padding: 0.6rem 0.9rem;
    margin-bottom: 0.75rem;
    font-size: var(--t-sm);
    box-shadow: var(--shadow);
  }
  .meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    padding-bottom: 0.5rem;
  }
  .no {
    font-size: var(--t-2xl);
    color: var(--binding);
  }
  .date {
    color: var(--ink-soft);
    font-size: var(--t-sm);
    display: flex;
    gap: 0.4rem;
    align-items: center;
    flex-wrap: wrap;
  }
  .tag {
    font-size: var(--t-xs);
    font-weight: 600;
    padding: 0.05rem 0.5rem;
    border-radius: 999px;
    background: var(--page-2);
    color: var(--ink);
  }
  .steps {
    list-style: none;
    margin: 0;
    padding: 0 0 0.9rem;
    display: flex;
    gap: 0.4rem;
    overflow-x: auto;
  }
  .step {
    display: inline-flex;
    gap: 0.35rem;
    align-items: center;
    min-height: 2.25rem;
    padding: 0.2rem 0.8rem;
    border-radius: 999px;
    border: 1.5px solid var(--rule);
    background: transparent;
    font-size: var(--t-sm);
    font-weight: 600;
    cursor: pointer;
    white-space: nowrap;
  }
  .step:disabled {
    opacity: 0.45;
    cursor: default;
  }
  .step.answered,
  .step.total {
    border-style: solid;
    border-color: transparent;
    background: var(--surface);
    box-shadow: var(--shadow);
  }
  .step.active {
    border: 1.5px solid var(--binding);
  }
  .sf {
    font-weight: 500;
  }
  .sheet {
    padding: 1.5rem 1.25rem 1.75rem;
    scroll-margin-top: 4.5rem;
  }
  @media (min-width: 40rem) {
    .sheet {
      padding: 2rem 2rem 2.25rem;
    }
  }
  .sheet > :global(*) {
    min-width: 0;
  }
  .ask {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.25rem;
    animation: turn 0.35s ease-out;
  }
  @keyframes turn {
    from {
      opacity: 0;
      transform: translateX(14px);
    }
  }
  .qmeta {
    color: var(--ink-soft);
    font-size: var(--t-sm);
    font-weight: 500;
  }
  .prompt {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: clamp(1.45rem, 5.6vw, 2rem);
    line-height: 1.22;
    letter-spacing: -0.01em;
    max-width: 34rem;
  }
</style>
