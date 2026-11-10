<script lang="ts">
  import type { Puzzle } from '$lib/data/puzzle';

  let {
    puzzle,
    answered,
    current,
    onjump
  }: { puzzle: Puzzle; answered: number; current: number | 'results'; onjump: (i: number) => void } = $props();
</script>

<div class="chead">
  <span class="brand">Andaaza</span>
  <ol class="steps" aria-label="Questions">
    {#each puzzle.questions as q, i (q.id)}
      {@const reachable = i < answered || i === current}
      <li>
        <button
          class="step"
          class:active={i === current}
          class:done={i < answered}
          disabled={!reachable || i === current}
          aria-current={i === current ? 'step' : undefined}
          aria-label="Question {i + 1}{i < answered ? ', answered' : ''}"
          onclick={() => onjump(i)}
        >
          <span class="qn">Q{i + 1}</span><span class="qe" aria-hidden="true">{q.emoji}</span>
        </button>
      </li>
    {/each}
  </ol>
  <span class="no num">No. {puzzle.number}</span>
</div>

<style>
  .chead {
    display: grid;
    grid-template-columns: 1fr auto 1fr;
    align-items: center;
    gap: 0.5rem;
  }
  .brand {
    font-family: var(--font-display);
    font-size: 1.2rem;
    line-height: 1;
  }
  .no {
    justify-self: end;
    font-weight: 700;
    font-size: 1rem;
  }
  .steps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    gap: 0.25rem;
  }
  .step {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.25rem 0.45rem;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: inherit;
    font-weight: 800;
    font-size: 0.82rem;
    letter-spacing: 0.08em;
    opacity: 0.45;
    cursor: default;
    transition:
      opacity 0.25s ease,
      background-color 0.25s ease;
  }
  .step.done {
    opacity: 0.8;
    cursor: pointer;
  }
  .step.done:hover {
    background: color-mix(in srgb, currentColor 14%, transparent);
  }
  .step.active {
    opacity: 1;
  }
  .step[disabled] {
    cursor: default;
  }
  .qe {
    font-size: 1.05rem;
  }
  @media (max-width: 26rem) {
    .qn {
      display: none;
    }
    .step {
      padding: 0.2rem 0.3rem;
    }
  }
</style>
