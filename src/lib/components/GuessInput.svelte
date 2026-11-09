<script lang="ts">
  import { formatGrouped, formatWords, parseGuess, sanitizeGuessInput, type NumberStyle } from '$lib/core/number';
  import type { Question } from '$lib/data/types';

  let {
    question,
    numberStyle,
    onlock,
    oncalc,
    prefill = $bindable('')
  }: {
    question: Question;
    numberStyle: NumberStyle;
    onlock: (guess: number) => void;
    oncalc: () => void;
    prefill?: string;
  } = $props();

  let input: HTMLInputElement | undefined = $state();
  let touched = $state(false);
  let text = $derived(prefill);
  let value = $derived(parseGuess(text));

  const words = $derived(
    numberStyle === 'indian'
      ? [
          ['thousand', 'thousand'],
          ['lakh', 'lakh'],
          ['crore', 'crore']
        ]
      : [
          ['thousand', 'thousand'],
          ['million', 'million'],
          ['billion', 'billion']
        ]
  );

  function addWord(w: string) {
    const base = text.replace(/\s*[a-z ]+$/i, '').trim() || '1';
    prefill = `${base} ${w}`;
    touched = true;
    input?.focus();
  }

  function submit(e: Event) {
    e.preventDefault();
    touched = true;
    if (value !== null) onlock(value);
  }

  export function focus() {
    input?.focus();
  }
</script>

<form class="guess" onsubmit={submit} novalidate>
  <label class="visually-hidden" for="guess-{question.id}">Your guess for: {question.prompt}</label>
  <div class="entry" class:bad={touched && text && value === null}>
    {#if question.unit.prefix}<span class="prefix" aria-hidden="true">{question.unit.prefix}</span>{/if}
    <input
      bind:this={input}
      id="guess-{question.id}"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      autocapitalize="off"
      spellcheck="false"
      enterkeyhint="done"
      placeholder="Your andaaza"
      value={text}
      oninput={(e) => {
        prefill = sanitizeGuessInput(e.currentTarget.value);
        if (e.currentTarget.value !== prefill) e.currentTarget.value = prefill;
      }}
      onblur={() => (touched = true)}
      aria-describedby="guess-help-{question.id}"
    />
    {#if question.unit.label}<span class="unit">{question.unit.label}</span>{/if}
  </div>

  <p class="preview num" id="guess-help-{question.id}" aria-live="polite">
    {#if value !== null}
      = {question.unit.prefix ?? ''}{formatGrouped(value, numberStyle)}
      {#if value >= 1000}<span class="words">({formatWords(value, numberStyle)})</span>{/if}
    {:else if touched && text}
      <span class="err">Type a number, like 45000, 4.5 lakh or 2 crore.</span>
    {:else}
      <span class="hint">Napkin maths welcome. Exact answers not required.</span>
    {/if}
  </p>

  <div class="tools">
    <div class="mags" role="group" aria-label="Add a size word">
      {#each words as [w, label] (w)}
        <button type="button" class="chip" onclick={() => addWord(w)}>{label}</button>
      {/each}
    </div>
    <button type="button" class="chip calc" onclick={oncalc} aria-label="Open calculator and rough work">
      <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"
        ><path
          fill="currentColor"
          d="M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2Zm0 2v4h12V4H6Zm1 7v2h2v-2H7Zm4 0v2h2v-2h-2Zm4 0v2h2v-2h-2Zm-8 4v2h2v-2H7Zm4 0v2h2v-2h-2Zm4 0v6h2v-6h-2Zm-8 4v2h2v-2H7Zm4 0v2h2v-2h-2Z"
        /></svg
      >
      Calculator
    </button>
  </div>

  <button class="btn block lock" type="submit" disabled={value === null}>Lock my guess</button>
</form>

<style>
  .guess {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.6rem;
  }
  .entry {
    display: flex;
    align-items: baseline;
    gap: 0.35rem;
    border-bottom: 3px solid var(--ink);
    padding: 0.25rem 0;
  }
  .entry.bad {
    border-color: var(--bad);
  }
  .entry:focus-within {
    border-color: var(--binding);
  }
  .prefix {
    font-family: var(--font-display);
    font-size: var(--t-2xl);
  }
  input {
    flex: 1;
    min-width: 0;
    width: 100%;
    border: none;
    background: transparent;
    font-family: var(--font-display);
    font-size: var(--t-2xl);
    line-height: 1.1;
    padding: 0;
    outline: none;
  }
  input::placeholder {
    color: var(--ink-soft);
    opacity: 0.55;
  }
  .unit {
    font-size: var(--t-md);
    color: var(--ink-soft);
    white-space: nowrap;
    max-width: 40%;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .preview {
    min-height: 1.6em;
    font-size: var(--t-sm);
  }
  .words,
  .hint {
    color: var(--ink-soft);
  }
  .err {
    color: var(--bad);
  }
  .tools {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .mags {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }
  .calc {
    gap: 0.35rem;
  }
  .lock {
    margin-top: 0.5rem;
  }
</style>
