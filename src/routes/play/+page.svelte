<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Calculator from '$lib/components/Calculator.svelte';
  import GuessInput from '$lib/components/GuessInput.svelte';
  import Results from '$lib/components/Results.svelte';
  import Reveal from '$lib/components/Reveal.svelte';
  import { formatLongDate, isDateKey, istDateKey, daysBetween } from '$lib/core/date';
  import { formatFactor } from '$lib/core/number';
  import { bucketOf, dayScore, emojiFor, factorOf } from '$lib/core/score';
  import { puzzleFor, type Puzzle } from '$lib/data/puzzle';
  import { online, puzzleStats, recordAnswer, recordGame, type PuzzleStats } from '$lib/state/online';
  import { settings } from '$lib/state/settings.svelte';
  import { loadGame, saveGame, sessionId, type SavedGame } from '$lib/state/storage';

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
    const requested = new URLSearchParams(location.search).get('d');
    let key = today;
    if (requested && isDateKey(requested)) {
      if (daysBetween(requested, today) < 0) notice = 'That puzzle hasn’t been released yet, so here is today’s.';
      else if (!puzzleFor(requested)) notice = 'Andaaza started later than that date, so here is today’s puzzle.';
      else key = requested;
    }
    const p = puzzleFor(key);
    if (!p) {
      ready = true;
      return;
    }
    puzzle = p;
    const saved = loadGame(key);
    const ids = p.questions.map((q) => q.id);
    if (saved && saved.questionIds.join() === ids.join()) {
      game = saved;
    } else {
      game = {
        dateKey: key,
        mode: key === today ? 'daily' : 'archive',
        questionIds: ids,
        answers: p.questions.map((q) => q.answer),
        guesses: [],
        completed: false,
        startedAt: Date.now()
      };
    }
    view = game.completed ? { phase: 'results' } : { phase: 'guess', idx: game.guesses.length };
    ready = true;
    refreshStats();
  });

  async function refreshStats() {
    if (!online || !puzzle) return;
    stats = await puzzleStats(puzzle.dateKey);
  }

  function lock(guess: number) {
    if (!puzzle || !game || view.phase !== 'guess') return;
    const idx = view.idx;
    if (game.guesses.length !== idx) return;
    const q = puzzle.questions[idx];
    game.guesses = [...game.guesses, guess];
    saveGame($state.snapshot(game) as SavedGame);
    draft = '';
    view = { phase: 'reveal', idx };
    scrollTop();
    if (online) {
      recordAnswer({
        session: sessionId(),
        dateKey: puzzle.dateKey,
        mode: game.mode,
        idx,
        questionId: q.id,
        guess,
        factor: factorOf(guess, q.answer),
        bucket: bucketOf(guess, q.answer)
      }).then(refreshStats);
    }
  }

  function next() {
    if (!puzzle || !game || view.phase !== 'reveal') return;
    const n = view.idx + 1;
    if (n < game.guesses.length) {
      view = { phase: 'reveal', idx: n };
    } else if (n < puzzle.questions.length) {
      view = { phase: 'guess', idx: n };
    } else {
      finish();
    }
    scrollTop();
  }

  function finish() {
    if (!puzzle || !game) return;
    if (!game.completed) {
      game.completed = true;
      game.completedAt = Date.now();
      saveGame($state.snapshot(game) as SavedGame);
      if (online && !game.reported) {
        const score = dayScore(game.guesses.map((g, i) => factorOf(g, game!.answers[i])));
        recordGame({
          session: sessionId(),
          dateKey: puzzle.dateKey,
          mode: game.mode,
          score,
          nickname: settings.value.nickname
        }).then((r) => {
          if (r !== null && game) {
            game.reported = true;
            saveGame($state.snapshot(game) as SavedGame);
          }
          refreshStats();
        });
      }
    }
    view = { phase: 'results' };
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
    if (game.completed) return idx + 1 < puzzle.questions.length ? `Next: question ${idx + 2}` : 'Back to my total';
    return idx + 1 < puzzle.questions.length ? `On to question ${idx + 2}` : 'See my total';
  }
</script>

<svelte:head>
  <title>{puzzle ? `Andaaza No. ${puzzle.number}` : 'Play Andaaza'}</title>
  <meta name="description" content="Three questions about India, one guess each. How close can you get?" />
</svelte:head>

<div class="wrap">
  {#if !ready}
    <p class="loading">Opening the ledger…</p>
  {:else if !puzzle || !game}
    <section class="empty">
      <h1>The first puzzle hasn’t opened yet</h1>
      <p>Come back on launch day.</p>
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

    <article id="sheet" class="ledger sheet">
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
    padding: 0 0 1rem;
  }
  .loading,
  .empty,
  .notice {
    padding: 1rem var(--gutter);
  }
  .notice {
    background: var(--page-2);
    border-left: 4px solid var(--accent);
    margin: 0 var(--gutter) 0.75rem;
    font-size: var(--t-sm);
  }
  .meta {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.25rem 1rem;
    padding: 0.25rem var(--gutter) 0.5rem;
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
    padding: 0 var(--gutter) 0.6rem;
    display: flex;
    gap: 0.4rem;
    overflow-x: auto;
  }
  .step {
    display: inline-flex;
    gap: 0.35rem;
    align-items: center;
    min-height: 2.25rem;
    padding: 0.2rem 0.75rem;
    border-radius: 999px;
    border: 1.5px dashed var(--ink-soft);
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
    border-color: var(--rule);
    background: var(--page-2);
  }
  .step.active {
    border-color: var(--binding);
    border-style: solid;
    box-shadow: inset 0 0 0 1px var(--binding);
  }
  .sf {
    font-weight: 500;
  }
  .sheet {
    padding-top: 1.25rem;
    padding-bottom: 2rem;
    border-top: 6px solid var(--binding);
    scroll-margin-top: 0.5rem;
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
    font-weight: 600;
    font-size: clamp(1.45rem, 5.6vw, 2rem);
    line-height: 1.25;
    max-width: 34rem;
  }
</style>
