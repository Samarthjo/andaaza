<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import Calculator from '$lib/components/Calculator.svelte';
  import Countdown from '$lib/components/Countdown.svelte';
  import GuessInput from '$lib/components/GuessInput.svelte';
  import { formatShortDate, istDateKey } from '$lib/core/date';
  import { formatFactor } from '$lib/core/number';
  import { verdictFor } from '$lib/core/score';
  import { puzzleFor, type Puzzle } from '$lib/data/puzzle';
  import { gameScore, lockGuess, openGame } from '$lib/state/game';
  import { settings } from '$lib/state/settings.svelte';
  import type { SavedGame } from '$lib/state/storage';

  let puzzle = $state<Puzzle | null>(null);
  let game = $state<SavedGame | null>(null);
  let draft = $state('');
  let calcOpen = $state(false);
  let ready = $state(false);

  onMount(() => {
    const today = istDateKey();
    puzzle = puzzleFor(today);
    if (puzzle) game = openGame(puzzle, today);
    ready = true;
  });

  const status = $derived(!game ? 'none' : game.completed ? 'done' : game.guesses.length ? 'started' : 'new');
  const q = $derived(puzzle && game ? puzzle.questions[game.guesses.length] : null);

  function lock(guess: number) {
    if (!puzzle || !game) return;
    const next = lockGuess(puzzle, game, guess);
    if (next) goto(`${base}/play?r=${next.guesses.length - 1}`);
  }
</script>

<div class="card-wrap">
  <div class="card" class:loading={!ready}>
    <div class="top">
      <span>{puzzle ? formatShortDate(puzzle.dateKey) : ''}</span>
      <span class="no num">{puzzle ? `No. ${puzzle.number}` : ''}</span>
    </div>

    {#if !ready}
      <div class="skeleton" aria-hidden="true"><span></span><span></span><span></span></div>
    {:else if !puzzle || !game}
      <p class="prompt">The first puzzle opens soon.</p>
    {:else if status === 'done'}
      {@const s = gameScore(game)}
      <p class="label">Today’s total</p>
      <p class="score num"><span class="double-rule">{formatFactor(s)}</span></p>
      <p class="verdict">{verdictFor(s).label}</p>
      <div class="row">
        <a class="pill-btn" href="{base}/play">See my results</a>
      </div>
      <div class="cd"><Countdown /></div>
    {:else if status === 'started'}
      <p class="label">In progress</p>
      <p class="prompt">You’re on question {game.guesses.length + 1} of 3.</p>
      <div class="row">
        <a class="pill-btn" href="{base}/play">Continue</a>
      </div>
    {:else if q}
      <p class="label">
        <span aria-hidden="true">{q.emoji}</span> Question 1 of 3
      </p>
      <h2 class="prompt">{q.prompt}</h2>
      <GuessInput
        question={q}
        numberStyle={settings.value.numberStyle}
        bind:prefill={draft}
        onlock={lock}
        oncalc={() => (calcOpen = true)}
      />
    {/if}
  </div>
</div>

{#if puzzle}
  <Calculator bind:open={calcOpen} dateKey={puzzle.dateKey} numberStyle={settings.value.numberStyle} onuse={(v) => (draft = v)} />
{/if}

<style>
  /* The card flips the page colours: binding colour as background, its ink as text.
     Custom properties are re-pointed so GuessInput and buttons inside re-theme themselves. */
  .card-wrap {
    --card-bg: var(--binding);
    --card-ink: var(--binding-ink);
  }
  .card {
    --ink: var(--card-ink);
    --ink-soft: color-mix(in srgb, var(--card-ink) 72%, transparent);
    --rule: color-mix(in srgb, var(--card-ink) 28%, transparent);
    --page-2: color-mix(in srgb, var(--card-ink) 14%, transparent);
    --binding: var(--card-ink);
    --binding-ink: var(--card-bg);
    --bad: var(--haldi);
    position: relative;
    display: grid;
    gap: 1rem;
    padding: 1.25rem 1.25rem 1.5rem;
    border-radius: var(--radius-lg);
    background: var(--card-bg);
    color: var(--card-ink);
    box-shadow: 0 24px 50px -24px rgb(0 0 0 / 0.55);
    transform: rotate(-1.2deg);
    transition: transform 0.35s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .card:focus-within,
  .card:hover {
    transform: rotate(0deg);
  }
  .top {
    display: flex;
    justify-content: space-between;
    font-weight: 600;
    font-size: var(--t-sm);
  }
  .label {
    font-size: var(--t-sm);
    font-weight: 600;
    color: var(--ink-soft);
  }
  .prompt {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: clamp(1.4rem, 5.2vw, 1.9rem);
    line-height: 1.22;
    letter-spacing: -0.01em;
  }
  .score {
    font-family: var(--font-display);
    font-size: clamp(3.5rem, 18vw, 5.5rem);
    line-height: 1;
  }
  .score .double-rule {
    display: inline-block;
    border-bottom-width: 7px;
  }
  .verdict {
    font-family: var(--font-display);
    font-size: var(--t-xl);
  }
  .row {
    display: flex;
    gap: 0.6rem;
  }
  .pill-btn {
    display: inline-flex;
    align-items: center;
    min-height: 3rem;
    padding: 0 1.6rem;
    border-radius: 999px;
    background: var(--card-ink);
    color: var(--card-bg);
    font-weight: 700;
    text-decoration: none;
    box-shadow: 0 10px 20px -12px rgb(0 0 0 / 0.6);
  }
  .cd {
    --ink: var(--card-ink);
  }
  .skeleton {
    display: grid;
    gap: 0.6rem;
    padding: 0.5rem 0 1.5rem;
  }
  .skeleton span {
    height: 1.4rem;
    border-radius: 6px;
    background: var(--page-2);
  }
  .skeleton span:nth-child(2) {
    width: 80%;
  }
  .skeleton span:nth-child(3) {
    width: 45%;
    height: 2.6rem;
    margin-top: 0.75rem;
  }
</style>
