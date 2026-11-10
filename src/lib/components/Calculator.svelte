<script lang="ts">
  import { tryEvaluate } from '$lib/core/calc';
  import { formatGrouped, formatWords, type NumberStyle } from '$lib/core/number';
  import { readJSON, writeJSON } from '$lib/state/storage';
  import Icon from './Icon.svelte';
  import Sheet from './Sheet.svelte';

  let {
    open = $bindable(false),
    dateKey,
    numberStyle,
    onuse
  }: { open: boolean; dateKey: string; numberStyle: NumberStyle; onuse: (expr: string) => void } = $props();

  let expr = $state('');
  let notes = $state('');
  let loadedFor = '';

  $effect(() => {
    if (dateKey !== loadedFor) {
      loadedFor = dateKey;
      notes = readJSON<string>(`notes:${dateKey}`, '');
    }
  });

  const result = $derived(expr.trim() ? tryEvaluate(expr) : null);
  const bigWord = $derived(numberStyle === 'indian' ? 'lakh' : 'million');
  const hugeWord = $derived(numberStyle === 'indian' ? 'crore' : 'billion');
  const keys = $derived([
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],
    ['1', '2', '3', '−'],
    ['0', '.', '%', '+'],
    ['(', ')', bigWord, hugeWord]
  ]);

  function press(k: string) {
    const t = k === '−' ? '-' : k;
    expr = /^[a-z]/i.test(t) ? `${expr.trimEnd()} ${t} ` : expr + t;
  }

  function use() {
    if (result === null || result <= 0) return;
    onuse(String(Math.round(result * 1000) / 1000));
    open = false;
  }
</script>

<Sheet bind:open side="bottom" labelledby="calc-title">
  <div class="calc">
    <header>
      <h2 id="calc-title">Calculator</h2>
      <button class="icon-btn" onclick={() => (open = false)} aria-label="Close calculator"><Icon name="x" size={20} /></button>
    </header>

    <label class="visually-hidden" for="calc-expr">Calculation</label>
    <input
      id="calc-expr"
      class="expr num"
      bind:value={expr}
      inputmode="text"
      autocomplete="off"
      placeholder="140 crore × 0.3 ÷ 4"
      onkeydown={(e) => {
        if (e.key === 'Enter') use();
      }}
    />
    <p class="result num" aria-live="polite">
      {#if result !== null}
        = {formatGrouped(result, numberStyle)}
        {#if Math.abs(result) >= 1000}<span>({formatWords(result, numberStyle)})</span>{/if}
      {:else if expr.trim()}
        <span>…</span>
      {/if}
    </p>

    <div class="pad" role="group" aria-label="Keypad">
      {#each keys as row, r (r)}
        {#each row as k (k)}
          <button type="button" class="key" class:word={/^[a-z]/i.test(k)} onclick={() => press(k)}>{k}</button>
        {/each}
      {/each}
      <button type="button" class="key" onclick={() => (expr = expr.slice(0, -1))} aria-label="Delete last character">⌫</button>
      <button type="button" class="key" onclick={() => (expr = '')}>Clear</button>
      <button type="button" class="btn use" disabled={result === null || result <= 0} onclick={use}>Use as my guess</button>
    </div>

    <label class="notes-label" for="calc-notes">Rough work for this puzzle</label>
    <textarea
      id="calc-notes"
      class="notes hand"
      rows="3"
      bind:value={notes}
      oninput={() => writeJSON(`notes:${dateKey}`, notes)}
      placeholder="Jot your working here…"
    ></textarea>
  </div>
</Sheet>

<style>
  .calc {
    padding: 1rem 1.25rem 1.4rem;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 0.6rem;
  }
  header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  h2 {
    font-size: var(--t-xl);
  }
  .expr {
    width: 100%;
    font-size: var(--t-lg);
    padding: 0.65rem 0.85rem;
    border-radius: 14px;
    border: 2px solid var(--rule);
    background: var(--surface);
  }
  .expr:focus {
    border-color: var(--binding);
    outline: none;
  }
  .result {
    font-weight: 800;
    font-size: var(--t-lg);
    min-height: 1.6em;
  }
  .result span {
    font-weight: 500;
    font-size: var(--t-sm);
    color: var(--ink-soft);
  }
  .pad {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.4rem;
  }
  .key {
    min-height: 2.9rem;
    border-radius: 14px;
    border: none;
    background: var(--surface);
    box-shadow: var(--shadow);
    font-size: var(--t-lg);
    font-weight: 600;
    cursor: pointer;
    transition:
      transform 0.15s var(--ease-out),
      background-color 0.15s ease;
  }
  .key:active {
    transform: scale(0.95);
    background: var(--page-2);
  }
  .key.word {
    font-size: var(--t-sm);
    font-weight: 700;
  }
  .use {
    grid-column: span 2;
  }
  .notes-label {
    font-weight: 600;
    font-size: var(--t-sm);
    margin-top: 0.4rem;
  }
  .notes {
    width: 100%;
    resize: vertical;
    font-size: var(--t-md);
    line-height: 1.6;
    padding: 0.5rem 0.75rem;
    border: none;
    border-radius: 14px;
    background: var(--surface);
  }
</style>
