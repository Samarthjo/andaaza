<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { formatGrouped, formatWords, parseGuess, sanitizeGuessInput, type NumberStyle } from '$lib/core/number';
  import type { Question } from '$lib/data/types';

  let {
    question,
    numberStyle,
    draft = $bindable(''),
    onlock,
    oncalc
  }: {
    question: Question;
    numberStyle: NumberStyle;
    draft?: string;
    onlock: (guess: number) => void;
    oncalc: () => void;
  } = $props();

  let input: HTMLInputElement | undefined = $state();
  let touched = $state(false);
  const value = $derived(parseGuess(draft));
  const words = $derived(numberStyle === 'indian' ? ['thousand', 'lakh', 'crore'] : ['thousand', 'million', 'billion']);

  function addWord(w: string) {
    const base = draft.replace(/\s*[a-z ]+$/i, '').trim() || '1';
    draft = `${base} ${w}`;
    touched = true;
    input?.focus();
  }

  function submit(e: Event) {
    e.preventDefault();
    touched = true;
    if (value !== null) onlock(value);
  }
</script>

<form class="q" onsubmit={submit} novalidate>
  <h2 class="prompt">{question.prompt}</h2>

  <label class="box" class:bad={touched && draft && value === null}>
    <span class="visually-hidden">Your guess</span>
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
      placeholder="your guess"
      value={draft}
      oninput={(e) => {
        draft = sanitizeGuessInput(e.currentTarget.value);
        if (e.currentTarget.value !== draft) e.currentTarget.value = draft;
      }}
      onblur={() => (touched = true)}
      aria-describedby="help-{question.id}"
    />
    {#if question.unit.label}<span class="unit lbl">{question.unit.label}</span>{/if}
  </label>

  <div class="under">
    <p class="help num preview" id="help-{question.id}" aria-live="polite">
      {#if value !== null}
        = {question.unit.prefix ?? ''}{formatGrouped(value, numberStyle)}{#if value >= 1000}&nbsp;({formatWords(value, numberStyle)}){/if}
      {:else if touched && draft}
        <span class="err">Try 45000, 4.5 lakh or 2 crore</span>
      {/if}
    </p>
    <div class="adds" role="group" aria-label="Add a size word">
      {#each words as w (w)}<button type="button" onclick={() => addWord(w)}>+ {w}</button>{/each}
    </div>
  </div>

  <div class="actions">
    <button type="button" class="round-btn" onclick={oncalc} aria-label="Open calculator">
      <Icon name="calculator" size={22} />
    </button>
    <button type="submit" class="pill lock" disabled={value === null}>Lock it in <span aria-hidden="true">↵</span></button>
  </div>
</form>

<style>
  .q {
    display: grid;
    gap: 1.1rem;
  }
  .prompt {
    font-family: var(--font-ui);
    font-weight: 800;
    font-size: clamp(1.6rem, 6vw, 2.5rem);
    line-height: 1.12;
    letter-spacing: -0.02em;
    margin: 1.25rem 0 0.75rem;
  }
  .box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-height: 4.6rem;
    padding: 0.6rem 1.25rem;
    border-radius: 18px;
    background: color-mix(in srgb, #fff 16%, transparent);
    cursor: text;
    transition:
      background-color 0.2s ease,
      box-shadow 0.2s ease;
  }
  .box:focus-within {
    background: color-mix(in srgb, #fff 22%, transparent);
    box-shadow: 0 0 0 3px color-mix(in srgb, #fff 35%, transparent);
  }
  .box.bad {
    box-shadow: 0 0 0 3px var(--hl-text);
  }
  .prefix,
  input {
    font-family: var(--font-ui);
    font-weight: 800;
    font-size: clamp(1.9rem, 7vw, 2.6rem);
    line-height: 1.1;
  }
  input {
    flex: 1;
    min-width: 0;
    width: 100%;
    border: none;
    background: transparent;
    color: inherit;
    outline: none;
    padding: 0;
    font-variant-numeric: tabular-nums;
  }
  input::placeholder {
    color: inherit;
    opacity: 0.45;
    font-weight: 700;
  }
  .unit {
    flex: none;
    max-width: 45%;
    text-align: right;
    opacity: 0.85;
    font-size: 0.72rem;
    line-height: 1.3;
  }
  .under {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 0.25rem 1rem;
    min-height: 1.6rem;
    margin-top: -0.4rem;
  }
  .help {
    font-size: 0.9rem;
    font-weight: 600;
    opacity: 0.85;
  }
  .err {
    color: var(--hl-text);
  }
  .adds {
    display: flex;
    gap: 0.25rem;
  }
  .adds button {
    border: none;
    background: transparent;
    color: inherit;
    font-size: 0.82rem;
    font-weight: 700;
    opacity: 0.75;
    padding: 0.3rem 0.45rem;
    border-radius: 8px;
    cursor: pointer;
    transition:
      opacity 0.2s ease,
      background-color 0.2s ease;
  }
  .adds button:hover {
    opacity: 1;
    background: color-mix(in srgb, #fff 14%, transparent);
  }
  .actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 0.4rem;
  }
</style>
