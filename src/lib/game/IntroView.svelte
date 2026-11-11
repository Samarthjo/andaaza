<script lang="ts">
  import { formatLongDate } from '$lib/core/date';
  import type { Puzzle } from '$lib/data/puzzle';

  let {
    puzzle,
    status,
    onplay
  }: { puzzle: Puzzle; status: 'new' | 'started' | 'done'; onplay: () => void } = $props();

  const cta = $derived(status === 'done' ? 'View results' : status === 'started' ? 'Continue' : 'Play today’s');

  // "padha-likha" hangs centred under the caret, nudged sideways only if it would spill off the card.
  let headline: HTMLElement | undefined = $state();
  let insert: HTMLElement | undefined = $state();
  let shift = $state(0);
  function clampInsert() {
    if (!headline || !insert) return;
    const box = headline.getBoundingClientRect();
    const r = insert.getBoundingClientRect();
    const left = r.left - shift;
    const right = r.right - shift;
    shift = left < box.left ? box.left - left : right > box.right ? box.right - right : 0;
  }
  $effect(() => {
    if (!headline) return;
    const ro = new ResizeObserver(clampInsert);
    ro.observe(headline);
    document.fonts?.ready.then(clampInsert);
    return () => ro.disconnect();
  });
</script>

<div class="intro">
  <div class="row">
    <span class="brand">Andaaza</span>
    <span class="no num">No. {puzzle.number}</span>
  </div>

  <h1 class="headline" aria-label="Ek padha-likha andaaza maaro." bind:this={headline}>
    <span class="line" aria-hidden="true"
      >Ek<span class="gap"
        ><svg class="caret" viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
          ><path d="M2.5 14.5 Q7 8 12 2 Q16.5 8.5 21.5 14" /></svg
        ><span class="insert" bind:this={insert} style:--shift="{shift}px">padha-likha</span></span
      >andaaza maaro.</span
    >
  </h1>

  <p class="meta">Andaaza #{puzzle.number} · {formatLongDate(puzzle.dateKey).replace(/^\w+, /, '')}</p>
  <ol class="qs" aria-label="Today’s topics">
    {#each puzzle.questions as q, i (q.id)}
      <li><span class="qn">Q{i + 1}</span> <span aria-hidden="true">{q.emoji}</span></li>
    {/each}
  </ol>

  <button class="pill play" onclick={onplay}>{cta} <span class="arrow" aria-hidden="true">→</span></button>
</div>

<style>
  .intro {
    display: grid;
    justify-items: center;
    text-align: center;
    gap: 0.9rem;
    padding: 0.25rem 0 0.5rem;
  }
  .row {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .brand {
    font-family: var(--font-display);
    font-size: 1.25rem;
  }
  .no {
    font-weight: 700;
  }
  .headline {
    justify-self: stretch;
    display: grid;
    justify-items: center;
    font-family: var(--font-ui);
    font-weight: 800;
    /* "Ek ^ andaaza maaro." is ~7.9em wide: scale with the screen so it always fits the card. */
    font-size: clamp(1.7rem, calc(12.4vw - 10px), 4.3rem);
    line-height: 0.95;
    letter-spacing: -0.035em;
    margin-top: clamp(1rem, 4vw, 2.1rem);
    /* Room for the hand-written insert that hangs below the line. */
    padding-bottom: 1.15em;
  }
  .line {
    white-space: nowrap;
  }
  /* The gap between "Ek" and "andaaza": a proof-reader's caret with the insert written underneath it. */
  .gap {
    position: relative;
    display: inline-block;
    width: 0.42em;
    height: 0.7em;
    color: var(--hl-text);
  }
  .caret {
    position: absolute;
    left: 50%;
    top: calc(100% - 0.08em);
    width: 0.4em;
    height: 0.27em;
    transform: translateX(-50%);
    overflow: visible;
  }
  .insert {
    position: absolute;
    left: 50%;
    top: calc(100% + 0.62em);
    transform: translateX(calc(-50% + var(--shift, 0px))) rotate(-3deg);
    font-family: var(--font-hand);
    font-weight: 700;
    font-size: 0.64em;
    letter-spacing: 0;
    line-height: 1;
    white-space: nowrap;
  }
  .meta {
    margin-top: clamp(0.6rem, 2.5vw, 1.3rem);
    font-weight: 700;
    font-size: 0.95rem;
    letter-spacing: 0.12em;
  }
  .qs {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 1.4rem;
    font-weight: 800;
    font-size: 0.85rem;
    letter-spacing: 0.1em;
  }
  .qn {
    opacity: 0.6;
  }
  .qs li span:last-child {
    font-size: 1.2rem;
    vertical-align: -0.1em;
  }
  .play {
    margin-top: 0.6rem;
    min-width: 13rem;
  }
</style>
