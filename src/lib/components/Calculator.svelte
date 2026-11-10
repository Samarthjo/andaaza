<script lang="ts">
  import { tryEvaluate } from '$lib/core/calc';
  import { formatGrouped, formatWords, type NumberStyle } from '$lib/core/number';
  import { readJSON, writeJSON } from '$lib/state/storage';

  let {
    open = $bindable(false),
    dateKey,
    numberStyle,
    onuse
  }: { open: boolean; dateKey: string; numberStyle: NumberStyle; onuse: (expr: string) => void } = $props();

  let dialog: HTMLDialogElement | undefined = $state();
  let expr = $state('');
  let notes = $state('');
  let loadedFor = '';

  $effect(() => {
    if (dateKey !== loadedFor) {
      loadedFor = dateKey;
      notes = readJSON<string>(`notes:${dateKey}`, '');
    }
  });
  $effect(() => {
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
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
    const map: Record<string, string> = { '−': '-' };
    const t = map[k] ?? k;
    const needsSpace = /^[a-z]/i.test(t);
    expr = needsSpace ? `${expr.trimEnd()} ${t} ` : expr + t;
  }

  function saveNotes() {
    writeJSON(`notes:${dateKey}`, notes);
  }

  function use() {
    if (result === null || result <= 0) return;
    onuse(String(Math.round(result * 1000) / 1000));
    open = false;
  }
</script>

<dialog bind:this={dialog} onclose={() => (open = false)} aria-labelledby="calc-title">
  <div class="sheet">
    <header>
      <h2 id="calc-title">Rough work</h2>
      <button class="btn quiet" onclick={() => (open = false)}>Close</button>
    </header>

    <label class="visually-hidden" for="calc-expr">Calculation</label>
    <input
      id="calc-expr"
      class="expr num"
      bind:value={expr}
      inputmode="text"
      autocomplete="off"
      placeholder="e.g. 140 crore × 0.3 ÷ 4"
      onkeydown={(e) => {
        if (e.key === 'Enter') use();
      }}
    />
    <p class="result num" aria-live="polite">
      {#if result !== null}
        = {formatGrouped(result, numberStyle)}
        {#if Math.abs(result) >= 1000}<span>({formatWords(result, numberStyle)})</span>{/if}
      {:else if expr.trim()}
        <span class="err">Keep going…</span>
      {:else}
        <span>Words work too: 2 lakh × 12.</span>
      {/if}
    </p>

    <div class="pad" role="group" aria-label="Keypad">
      {#each keys as row, r (r)}
        {#each row as k (k)}
          <button type="button" class="key" class:word={/^[a-z]/i.test(k)} onclick={() => press(k)}>{k}</button>
        {/each}
      {/each}
      <button type="button" class="key" onclick={() => (expr = expr.slice(0, -1))} aria-label="Delete last character"
        >⌫</button
      >
      <button type="button" class="key" onclick={() => (expr = '')}>Clear</button>
      <button type="button" class="btn use" disabled={result === null || result <= 0} onclick={use}>Use as my guess</button>
    </div>

    <label class="notes-label" for="calc-notes">Hisaab (saved for today’s puzzle)</label>
    <textarea id="calc-notes" class="notes hand" rows="4" bind:value={notes} oninput={saveNotes}
      placeholder="Jot your working here…"></textarea>
  </div>
</dialog>

<style>
  dialog {
    border: none;
    padding: 0;
    margin: auto auto 0;
    width: min(100%, 30rem);
    max-height: 94dvh;
    border-radius: 18px 18px 0 0;
    background: var(--page);
    color: var(--ink);
    box-shadow: 0 -12px 40px rgb(0 0 0 / 0.25);
  }
  @media (min-width: 40rem) {
    dialog {
      margin: auto;
      border-radius: 18px;
    }
  }
  dialog::backdrop {
    background: rgb(10 8 6 / 0.45);
  }
  .sheet {
    padding: 1rem 1.25rem 1.25rem;
    display: grid;
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
    padding: 0.6rem 0.75rem;
    border-radius: var(--radius);
    border: 2px solid var(--rule);
    background: var(--page-2);
  }
  .result {
    font-family: var(--font-display);
    font-size: var(--t-lg);
    min-height: 1.6em;
  }
  .result span {
    font-family: var(--font-ui);
    font-size: var(--t-sm);
    color: var(--ink-soft);
  }
  .result .err {
    color: var(--ink-soft);
  }
  .pad {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 0.4rem;
  }
  .key {
    min-height: 2.9rem;
    border-radius: var(--radius);
    border: 1.5px solid var(--rule);
    background: var(--page-2);
    font-size: var(--t-lg);
    cursor: pointer;
  }
  .key.word {
    font-size: var(--t-sm);
    font-weight: 600;
  }
  .key:active {
    transform: translateY(1px);
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
    line-height: 1.8rem;
    padding: 0.2rem 0.6rem;
    border: none;
    border-radius: var(--radius);
    background: var(--surface);
  }
</style>
