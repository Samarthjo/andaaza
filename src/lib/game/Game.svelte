<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { fade, fly } from 'svelte/transition';
  import { base } from '$app/paths';
  import Calculator from '$lib/components/Calculator.svelte';
  import Countdown from '$lib/components/Countdown.svelte';
  import WeekStrip from '$lib/components/WeekStrip.svelte';
  import { daysBetween, isDateKey, istDateKey } from '$lib/core/date';
  import { puzzleFor, type Puzzle } from '$lib/data/puzzle';
  import { finishGame, lockGuess, openGame, recorded, reportPending } from '$lib/state/game';
  import { online, puzzleStats, type PuzzleStats } from '$lib/state/online';
  import { settings } from '$lib/state/settings.svelte';
  import type { SavedGame } from '$lib/state/storage';
  import CardHeader from './CardHeader.svelte';
  import IntroView from './IntroView.svelte';
  import QuestionView from './QuestionView.svelte';
  import ResultsView from './ResultsView.svelte';
  import RevealView from './RevealView.svelte';

  type Phase = 'loading' | 'intro' | 'guess' | 'reveal' | 'results' | 'none';

  let {
    start = 'auto',
    phase = $bindable<Phase>('loading')
  }: { start?: 'intro' | 'auto'; phase?: Phase } = $props();

  let today = $state('');
  let puzzle = $state<Puzzle | null>(null);
  let game = $state<SavedGame | null>(null);
  let idx = $state(0);
  let stats = $state<PuzzleStats | null>(null);
  let calcOpen = $state(false);
  let draft = $state('');
  let notice = $state('');
  let cardEl: HTMLElement | undefined = $state();
  let innerH = $state(0);

  const numberStyle = $derived(settings.value.numberStyle);
  const isToday = $derived(puzzle?.dateKey === today);
  const status = $derived(!game ? 'new' : game.completed ? 'done' : game.guesses.length ? 'started' : 'new');

  const COLORS = ['var(--card-q1)', 'var(--card-q2)', 'var(--card-q3)'];
  const cardBg = $derived(
    phase === 'results' ? 'var(--card-done)' : phase === 'guess' || phase === 'reveal' ? COLORS[idx] : COLORS[0]
  );
  const cardFg = $derived(phase === 'results' ? 'var(--on-done)' : 'var(--on-card)');
  const viewKey = $derived(`${phase}-${idx}`);

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
      phase = 'none';
      return;
    }
    puzzle = p;
    game = openGame(p, today);
    const r = Number(params.get('r'));
    const deepLink = key !== today || params.has('r');
    if (start === 'intro' && !deepLink) phase = 'intro';
    else if (game.completed) phase = 'results';
    else if (params.has('r') && Number.isInteger(r) && r >= 0 && r < game.guesses.length) {
      idx = r;
      phase = 'reveal';
    } else {
      idx = game.guesses.length;
      phase = 'guess';
    }
    refreshStats();
  });

  async function refreshStats() {
    if (!online || !puzzle) return;
    // Wait for this player's own writes (and any backfill) so the charts include them.
    await reportPending();
    await recorded();
    const s = await puzzleStats(puzzle.dateKey);
    if (s) stats = s;
  }

  async function settle() {
    await tick();
    if (!cardEl) return;
    const top = cardEl.getBoundingClientRect().top;
    if (top < 60 || top > innerHeight * 0.5) {
      window.scrollTo({ top: window.scrollY + top - 72, behavior: 'smooth' });
    }
  }

  /** Start or resume from the intro card. */
  export function play() {
    if (!game || !puzzle) return;
    if (game.completed) phase = 'results';
    else {
      idx = game.guesses.length;
      phase = 'guess';
    }
    settle();
  }

  function lock(guess: number) {
    if (!puzzle || !game || phase !== 'guess' || game.guesses.length !== idx) return;
    const next = lockGuess(puzzle, game, guess);
    if (!next) return;
    game = next;
    draft = '';
    phase = 'reveal';
    settle();
    refreshStats();
  }

  function next() {
    if (!puzzle || !game || phase !== 'reveal') return;
    const n = idx + 1;
    if (n < game.guesses.length) idx = n;
    else if (n < puzzle.questions.length) {
      idx = n;
      phase = 'guess';
    } else {
      game = finishGame(puzzle, game, settings.value.nickname);
      phase = 'results';
      refreshStats();
    }
    settle();
  }

  function jump(i: number) {
    if (!game) return;
    if (i < game.guesses.length) {
      idx = i;
      phase = 'reveal';
    } else if (i === game.guesses.length && !game.completed) {
      idx = i;
      phase = 'guess';
    }
    settle();
  }

  function nextLabel(i: number): string {
    if (!game || !puzzle) return 'Next';
    const last = i + 1 >= puzzle.questions.length;
    if (game.completed) return last ? 'Results' : `Question ${i + 2}`;
    return last ? 'See results' : `Question ${i + 2}`;
  }
</script>

{#if notice}<p class="notice" role="status" transition:fade>{notice}</p>{/if}

{#if phase === 'none'}
  <p class="none">The first puzzle isn’t out yet.</p>
{:else}
  <section
    class="gcard"
    class:loading={phase === 'loading'}
    bind:this={cardEl}
    style:--card-bg={cardBg}
    style:--card-fg={cardFg}
    style:--pill-ink={cardBg}
    style:height={innerH ? `${innerH}px` : undefined}
    aria-label="Today’s puzzle"
  >
    <div class="pad" bind:offsetHeight={innerH}>
      {#if puzzle && game && (phase === 'guess' || phase === 'reveal')}
        <CardHeader {puzzle} answered={game.guesses.length} current={idx} onjump={jump} />
      {/if}
      <div class="stack">
        {#key viewKey}
          <div class="view" in:fly={{ y: 22, duration: 420, delay: 170 }} out:fade={{ duration: 160 }}>
            {#if phase === 'loading' || !puzzle || !game}
              <div class="skeleton" aria-hidden="true"><span></span><span></span><span></span></div>
            {:else if phase === 'intro'}
              <IntroView {puzzle} {status} onplay={play} />
            {:else if phase === 'guess'}
              <QuestionView
                question={puzzle.questions[idx]}
                {numberStyle}
                bind:draft
                onlock={lock}
                oncalc={() => (calcOpen = true)}
              />
            {:else if phase === 'reveal'}
              <RevealView
                question={puzzle.questions[idx]}
                guess={game.guesses[idx]}
                {numberStyle}
                crowd={stats?.buckets?.[idx] ?? null}
                nextLabel={nextLabel(idx)}
                onnext={next}
                oncalc={() => (calcOpen = true)}
              />
            {:else if phase === 'results'}
              <ResultsView {puzzle} guesses={game.guesses} scoreCrowd={stats?.scores ?? null} onreview={jump} />
            {/if}
          </div>
        {/key}
      </div>
    </div>
  </section>

  {#if phase === 'results' && puzzle}
    <div class="after" in:fly={{ y: 16, duration: 400, delay: 350 }}>
      {#if isToday}<Countdown />{/if}
      <WeekStrip {today} current={puzzle.dateKey} />
      <a class="more" href="{base}/archive">Browse the archive <span aria-hidden="true">→</span></a>
    </div>
  {/if}

  {#if puzzle}
    <Calculator
      bind:open={calcOpen}
      dateKey={puzzle.dateKey}
      qIndex={idx}
      {numberStyle}
      canUse={phase === 'guess'}
      onuse={(v) => (draft = v)}
    />
  {/if}
{/if}

<style>
  .gcard {
    --card-bg: var(--card-q1);
    position: relative;
    width: min(100%, 46rem);
    margin: 0 auto;
    border-radius: 30px;
    background: var(--card-bg);
    color: var(--card-fg, var(--on-card));
    box-shadow: 0 30px 60px -32px rgb(0 0 0 / 0.6);
    overflow: hidden;
    transition:
      background-color 0.55s ease,
      color 0.4s ease,
      height 0.5s var(--ease-out);
  }
  .pad {
    padding: 1.4rem 1.3rem 1.6rem;
  }
  @media (min-width: 40rem) {
    .pad {
      padding: 2.1rem 2.3rem 2.3rem;
    }
  }
  .stack {
    display: grid;
  }
  .view {
    grid-area: 1 / 1;
    min-width: 0;
  }
  .skeleton {
    display: grid;
    gap: 0.8rem;
    justify-items: center;
    padding: 4rem 0 3rem;
  }
  .skeleton span {
    width: 70%;
    height: 2.6rem;
    border-radius: 10px;
    background: color-mix(in srgb, #fff 18%, transparent);
  }
  .skeleton span:nth-child(2) {
    width: 45%;
  }
  .skeleton span:nth-child(3) {
    width: 13rem;
    height: 3rem;
    border-radius: 999px;
    margin-top: 1.5rem;
  }
  .notice {
    width: min(100%, 46rem);
    margin: 0 auto 0.75rem;
    padding: 0.6rem 0.9rem;
    border-radius: 12px;
    background: var(--surface);
    box-shadow: var(--shadow);
    font-size: var(--t-sm);
  }
  .none {
    text-align: center;
    padding: 3rem 1rem;
  }
  .after {
    width: min(100%, 46rem);
    margin: 1.5rem auto 0;
    display: grid;
    gap: 1rem;
  }
  .more {
    justify-self: start;
    font-weight: 700;
    text-decoration: none;
  }
  .more:hover {
    text-decoration: underline;
  }
</style>
