<script lang="ts">
  import { fly } from 'svelte/transition';
  import Icon from '$lib/components/Icon.svelte';
  import { formatFactor } from '$lib/core/number';
  import { factorOf, sideOf } from '$lib/core/score';
  import type { Question } from '$lib/data/types';

  let { question, open = $bindable(false) }: { question: Question; open: boolean } = $props();

  const f = $derived(factorOf(question.napkin.estimate, question.answer));
  const side = $derived(sideOf(question.napkin.estimate, question.answer));
</script>

<div class="napkin">
  {#if open}
    <div class="panel" id="napkin-{question.id}" transition:fly={{ y: 14, duration: 280 }}>
      <p class="lbl">One way to estimate it</p>
      <p class="lead">{question.napkin.lead}</p>
      <dl class="rows">
        {#each question.napkin.steps as [step, value], i (i)}
          <div><dt>{step}</dt><dd>{value}</dd></div>
        {/each}
        <div class="vs">
          <dt>Vs the real answer</dt>
          <dd class="num">{formatFactor(f)} {side === 'exact' ? 'spot on' : side}</dd>
        </div>
      </dl>
      {#if question.note}<p class="note">{question.note}</p>{/if}
    </div>
  {/if}
  <button class="toggle" aria-expanded={open} aria-controls="napkin-{question.id}" onclick={() => (open = !open)}>
    <span class="lbl">Napkin math</span>
    <span class="chev"><Icon name="chevron-up" size={20} /></span>
  </button>
</div>

<style>
  .napkin {
    position: relative;
    flex: 1;
    min-width: 0;
  }
  .toggle {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    width: 100%;
    min-height: 3.1rem;
    padding: 0 1.25rem;
    border: none;
    border-radius: 16px;
    background: color-mix(in srgb, #000 16%, transparent);
    color: inherit;
    cursor: pointer;
    transition: background-color 0.2s ease;
  }
  .toggle:hover {
    background: color-mix(in srgb, #000 22%, transparent);
  }
  .chev {
    display: grid;
    transition: transform 0.3s var(--ease-out);
  }
  .toggle[aria-expanded='true'] .chev {
    transform: rotate(180deg);
  }
  .toggle[aria-expanded='true'] {
    background: transparent;
  }
  .panel {
    position: absolute;
    z-index: 1;
    left: calc(-3.1rem - 0.75rem);
    right: 0;
    bottom: 0;
    max-height: min(70vh, 30rem);
    overflow-y: auto;
    padding: 1.25rem 1.25rem 4rem;
    border-radius: 18px;
    background: color-mix(in srgb, #000 30%, var(--card-bg));
    box-shadow: 0 -20px 40px -24px rgb(0 0 0 / 0.6);
    display: grid;
    gap: 0.6rem;
  }
  .lead {
    font-size: 1rem;
    line-height: 1.55;
  }
  .rows {
    margin: 0;
    display: grid;
  }
  .rows div {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.55rem 0;
    border-bottom: 1px dashed color-mix(in srgb, currentColor 35%, transparent);
    font-size: 0.95rem;
  }
  dd {
    margin: 0;
    text-align: right;
    font-weight: 700;
    white-space: nowrap;
  }
  .vs {
    border-bottom: none !important;
  }
  .vs dd {
    color: var(--hl-text);
  }
  .note {
    font-size: 0.82rem;
    opacity: 0.8;
  }
</style>
