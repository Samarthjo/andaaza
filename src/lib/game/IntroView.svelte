<script lang="ts">
  import { formatLongDate } from '$lib/core/date';
  import type { Puzzle } from '$lib/data/puzzle';

  let {
    puzzle,
    status,
    onplay
  }: { puzzle: Puzzle; status: 'new' | 'started' | 'done'; onplay: () => void } = $props();

  const cta = $derived(status === 'done' ? 'View results' : status === 'started' ? 'Continue' : 'Play today’s');
</script>

<div class="intro">
  <div class="row">
    <span class="brand">Andaaza</span>
    <span class="no num">No. {puzzle.number}</span>
  </div>

  <h1 class="headline" aria-label="Ek padha-likha tukka maaro.">
    <span class="line" aria-hidden="true">Ek<span class="caret">^</span>tukka maaro.</span>
    <span class="insert" aria-hidden="true">padha-likha</span>
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
    gap: 1.1rem;
    padding: 0.25rem 0 0.75rem;
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
    font-family: var(--font-ui);
    font-weight: 800;
    font-size: clamp(2.7rem, 11vw, 5.2rem);
    line-height: 0.95;
    letter-spacing: -0.035em;
    margin-top: clamp(1.5rem, 6vw, 3.5rem);
    display: grid;
    justify-items: center;
  }
  .line {
    position: relative;
    white-space: nowrap;
  }
  .caret {
    display: inline-block;
    width: 0.35em;
    margin: 0 0.06em;
    font-family: var(--font-hand);
    font-weight: 700;
    color: var(--hl-text);
    font-size: 0.55em;
    vertical-align: -0.55em;
    letter-spacing: 0;
  }
  .insert {
    font-family: var(--font-hand);
    font-weight: 700;
    font-size: 0.78em;
    letter-spacing: 0;
    line-height: 1.1;
    color: var(--hl-text);
    transform: rotate(-3deg);
    margin-top: 0.08em;
  }
  .meta {
    margin-top: clamp(1rem, 4vw, 2.2rem);
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
