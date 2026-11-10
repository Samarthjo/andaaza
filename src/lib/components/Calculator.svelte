<!--
  Calculator sheet: a lined scratch pad for each question next to a round-button keypad.
  The display is a real input, so a physical keyboard works as soon as the sheet opens
  (Enter or = evaluates). Taps on the keypad never pop up the phone keyboard.
-->
<script lang="ts">
  import { tryEvaluate } from '$lib/core/calc';
  import { formatGrouped, formatWords, type NumberStyle } from '$lib/core/number';
  import { readJSON, removeKey, writeJSON } from '$lib/state/storage';
  import Icon from './Icon.svelte';
  import Sheet from './Sheet.svelte';

  let {
    open = $bindable(false),
    dateKey,
    qIndex,
    numberStyle,
    canUse,
    onuse
  }: {
    open: boolean;
    dateKey: string;
    qIndex: number;
    numberStyle: NumberStyle;
    canUse: boolean;
    onuse: (expr: string) => void;
  } = $props();

  type Kind = 'num' | 'soft' | 'clear' | 'div' | 'mul' | 'sub' | 'add' | 'eq';
  const KEYS: { label: string; kind: Kind; insert?: string; aria?: string }[] = [
    { label: 'C', kind: 'clear', aria: 'Clear' },
    { label: '⌫', kind: 'soft', aria: 'Delete' },
    { label: '%', kind: 'soft', insert: '%', aria: 'Percent' },
    { label: '÷', kind: 'div', aria: 'Divide' },
    { label: '7', kind: 'num' },
    { label: '8', kind: 'num' },
    { label: '9', kind: 'num' },
    { label: '×', kind: 'mul', aria: 'Times' },
    { label: '4', kind: 'num' },
    { label: '5', kind: 'num' },
    { label: '6', kind: 'num' },
    { label: '−', kind: 'sub', aria: 'Minus' },
    { label: '1', kind: 'num' },
    { label: '2', kind: 'num' },
    { label: '3', kind: 'num' },
    { label: '+', kind: 'add', aria: 'Plus' },
    { label: 'π', kind: 'num', aria: 'Pi' },
    { label: '0', kind: 'num' },
    { label: '.', kind: 'num', aria: 'Decimal point' },
    { label: '=', kind: 'eq', aria: 'Equals' }
  ];

  let expr = $state('');
  let last = $state('');
  let fresh = false; // the display holds a result: a new number replaces it, an operator continues it
  let exprEl: HTMLInputElement | undefined = $state();

  const result = $derived(expr.trim() ? tryEvaluate(expr) : null);
  const words = $derived(numberStyle === 'indian' ? ['thousand', 'lakh', 'crore'] : ['thousand', 'million', 'billion']);
  const showResult = $derived(result !== null && (!/^[\d.]+$/.test(expr.trim()) || Math.abs(result) >= 1000));
  const size = $derived(expr.length <= 10 ? 2.1 : expr.length <= 15 ? 1.65 : expr.length <= 22 ? 1.3 : 1.05);

  const finePointer = () => typeof matchMedia !== 'undefined' && matchMedia('(pointer: fine)').matches;
  // With a mouse and keyboard, typing goes straight to the display. On touch screens the keypad is the keyboard.
  $effect(() => {
    if (!open) return;
    const t = setTimeout(() => finePointer() && exprEl?.focus({ preventScroll: true }), 80);
    return () => clearTimeout(t);
  });
  function refocus(e: MouseEvent) {
    if (e.detail > 0 && finePointer()) exprEl?.focus({ preventScroll: true });
  }

  function insert(t: string) {
    if (fresh && /^[\d.π(]$/.test(t)) expr = '';
    fresh = false;
    // Operators get breathing room ("2 lakh × 6"); a leading minus stays attached.
    if ('÷×−+'.includes(t) && expr.trim()) expr = `${expr.trimEnd()} ${t} `;
    else expr += t;
  }
  function addWord(w: string) {
    fresh = false;
    expr = `${expr.trimEnd()} ${w} `;
  }
  function backspace() {
    fresh = false;
    const t = expr.trimEnd();
    const word = t.match(/[a-z]+$/i);
    expr = (word ? t.slice(0, -word[0].length) : t.slice(0, -1)).trimEnd();
  }
  function equals() {
    if (result === null) return;
    last = `${expr.trim()} =`;
    // Big results keep their grouping (12,00,000); the parser ignores the commas.
    expr = Math.abs(result) >= 1000 ? formatGrouped(result, numberStyle) : String(Number(result.toPrecision(10)));
    fresh = true;
  }
  function press(k: (typeof KEYS)[number], e: MouseEvent) {
    if (k.kind === 'clear') {
      expr = '';
      last = '';
      fresh = false;
    } else if (k.label === '⌫') backspace();
    else if (k.kind === 'eq') equals();
    else insert(k.insert ?? k.label);
    refocus(e);
  }
  function use() {
    if (result === null || result <= 0) return;
    onuse(String(Math.round(result * 1000) / 1000));
    open = false;
  }

  // Scratch pad: one page per question, kept on this device.
  let notes = $state('');
  let loadedKey = '';
  const notesKey = $derived(`notes:${dateKey}:${qIndex}`);
  $effect(() => {
    if (notesKey === loadedKey) return;
    loadedKey = notesKey;
    // Older versions kept one page per day; it becomes the Q1 page.
    notes = readJSON<string>(notesKey, '') || (qIndex === 0 ? readJSON<string>(`notes:${dateKey}`, '') : '');
  });
  function saveNotes() {
    writeJSON(notesKey, notes);
    if (qIndex === 0) removeKey(`notes:${dateKey}`);
  }
  function clearNotes() {
    notes = '';
    saveNotes();
  }
</script>

<Sheet bind:open side="bottom" wide labelledby="calc-title">
  <div class="calc">
    <button type="button" class="grab" onclick={() => (open = false)} aria-label="Close calculator"><span></span></button>
    <h2 id="calc-title" class="visually-hidden">Calculator</h2>

    <div class="cols">
      <section class="keypad" aria-label="Calculator">
        <p class="last num" aria-hidden="true">{last}</p>
        <label class="visually-hidden" for="calc-expr">Calculation</label>
        <input
          id="calc-expr"
          bind:this={exprEl}
          class="display num"
          style:font-size="{size}rem"
          bind:value={expr}
          inputmode="none"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="0"
          oninput={() => (fresh = false)}
          onkeydown={(e) => {
            if (e.key === 'Enter' || e.key === '=') {
              e.preventDefault();
              equals();
            }
          }}
        />
        <p class="result num" aria-live="polite">
          {#if showResult && result !== null}
            = {formatGrouped(result, numberStyle)}
            {#if Math.abs(result) >= 1000}<span>· {formatWords(result, numberStyle)}</span>{/if}
          {/if}
        </p>

        <div class="chips" role="group" aria-label="Number words and brackets">
          {#each words as w (w)}
            <button type="button" class="chip-key" onclick={(e) => (addWord(w), refocus(e))}>{w}</button>
          {/each}
          <button type="button" class="chip-key" onclick={(e) => (insert('('), refocus(e))} aria-label="Open bracket">(</button>
          <button type="button" class="chip-key" onclick={(e) => (insert(')'), refocus(e))} aria-label="Close bracket">)</button>
        </div>

        <div class="keys" role="group" aria-label="Keypad">
          {#each KEYS as k (k.label)}
            <button type="button" class="key {k.kind}" aria-label={k.aria} onclick={(e) => press(k, e)}>
              {#if k.label === '⌫'}<Icon name="backspace" size={26} stroke={1.8} />{:else}{k.label}{/if}
            </button>
          {/each}
        </div>

        {#if canUse}
          <button type="button" class="use" disabled={result === null || result <= 0} onclick={use}>
            Use as my guess <span aria-hidden="true">→</span>
          </button>
        {/if}
      </section>

      <section class="scratch">
        <div class="shead">
          <label class="lbl" for="calc-notes">Scratch pad</label>
          <span class="lbl qn">Q{qIndex + 1}</span>
          <button type="button" class="trash" onclick={clearNotes} disabled={!notes} aria-label="Clear scratch pad">
            <Icon name="trash" size={20} stroke={1.8} />
          </button>
        </div>
        <textarea id="calc-notes" class="paper hand" bind:value={notes} oninput={saveNotes} placeholder="Jot your working here…"></textarea>
      </section>
    </div>
  </div>
</Sheet>

<style>
  .calc {
    --k-num: color-mix(in srgb, var(--ink) 7%, var(--surface));
    --k-soft: color-mix(in srgb, var(--ink) 3.5%, var(--surface));
    background: var(--surface);
  }
  .grab {
    display: grid;
    place-items: center;
    width: 5rem;
    height: 1.6rem;
    margin: 0 auto;
    border: none;
    background: none;
    cursor: pointer;
  }
  .grab span {
    width: 2.6rem;
    height: 5px;
    border-radius: 999px;
    background: color-mix(in srgb, var(--ink) 22%, transparent);
    transition: background-color 0.2s ease;
  }
  .cols {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    border-top: 1px solid var(--rule);
  }
  @media (min-width: 40rem) {
    .cols {
      grid-template-columns: minmax(0, 1fr) minmax(0, 25rem);
      grid-template-areas: 'scratch keypad';
    }
    .scratch {
      grid-area: scratch;
      border-top: none;
      border-right: 1px solid var(--rule);
    }
    .keypad {
      grid-area: keypad;
    }
  }

  /* Keypad */
  .keypad {
    display: grid;
    gap: 0.55rem;
    padding: 0.4rem 1.25rem 1.4rem;
  }
  @media (min-width: 40rem) {
    .keypad {
      padding: 0.9rem 1.75rem 1.75rem;
    }
  }
  .last {
    min-height: 1.3em;
    margin: 0 1.2rem -0.2rem;
    text-align: right;
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--ink-soft);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .display {
    width: 100%;
    min-height: 4.4rem;
    padding: 0 1.6rem;
    border: none;
    border-radius: 999px;
    background: var(--card-q2);
    color: #fff;
    caret-color: var(--haldi);
    text-align: right;
    font-family: var(--font-ui);
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .display::placeholder {
    color: rgb(255 255 255 / 0.8);
  }
  .display:focus {
    outline: 3px solid color-mix(in srgb, var(--card-q2) 30%, transparent);
    outline-offset: 3px;
  }
  .result {
    min-height: 1.45em;
    margin: 0 1.2rem;
    text-align: right;
    font-weight: 800;
    font-size: 1.05rem;
  }
  .result span {
    font-weight: 600;
    color: var(--ink-soft);
  }
  .chips {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.4rem;
    margin-bottom: 0.35rem;
  }
  .chip-key {
    min-height: 2.3rem;
    min-width: 2.6rem;
    padding: 0 0.85rem;
    border: 1.5px solid var(--rule);
    border-radius: 999px;
    background: transparent;
    color: var(--ink);
    font-weight: 700;
    font-size: 0.88rem;
    cursor: pointer;
    touch-action: manipulation;
    transition:
      background-color 0.15s ease,
      transform 0.14s var(--ease-out);
  }
  .chip-key:active {
    transform: scale(0.94);
  }
  .keys {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: clamp(0.55rem, 2.6vw, 1rem);
    justify-items: center;
  }
  .key {
    display: grid;
    place-items: center;
    width: 100%;
    max-width: min(4.8rem, 9.6dvh);
    aspect-ratio: 1;
    border: none;
    border-radius: 50%;
    background: var(--k-num);
    color: var(--ink);
    font-family: var(--font-ui);
    font-size: 1.75rem;
    font-weight: 700;
    line-height: 1;
    cursor: pointer;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition:
      transform 0.14s var(--ease-out),
      filter 0.15s ease;
  }
  .key:active {
    transform: scale(0.92);
  }
  .soft {
    background: var(--k-soft);
    font-size: 1.55rem;
  }
  .clear {
    background: var(--ink);
    color: var(--surface);
  }
  .div,
  .mul,
  .sub,
  .add {
    color: #fff;
    font-size: 2rem;
  }
  .div {
    background: #a8357f;
  }
  .mul {
    background: var(--card-q1);
  }
  .sub {
    background: var(--card-q2);
  }
  .add {
    background: var(--card-q3);
  }
  .eq {
    background: var(--card-done);
    color: #1b1a2e;
    font-size: 2rem;
  }
  .use {
    margin-top: 0.6rem;
    min-height: 3.3rem;
    border: none;
    border-radius: 999px;
    background: var(--ink);
    color: var(--surface);
    font-weight: 800;
    font-size: 0.85rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    cursor: pointer;
    transition:
      transform 0.2s var(--ease-out),
      opacity 0.2s ease;
  }
  .use[disabled] {
    opacity: 0.35;
    cursor: not-allowed;
    transform: none;
  }

  /* Hover only where there is a real pointer, so taps don't leave keys stuck in a hover state. */
  @media (hover: hover) {
    .grab:hover span {
      background: color-mix(in srgb, var(--ink) 40%, transparent);
    }
    .chip-key:hover {
      background: var(--k-soft);
    }
    .key:hover {
      filter: brightness(0.95);
    }
    .div:hover,
    .mul:hover,
    .sub:hover,
    .add:hover,
    .clear:hover {
      filter: brightness(1.12);
    }
    .use:not([disabled]):hover {
      transform: translateY(-1px);
    }
    .trash:not([disabled]):hover {
      background: color-mix(in srgb, var(--ink) 8%, transparent);
    }
  }

  /* Scratch pad */
  .scratch {
    display: grid;
    grid-template-rows: auto minmax(0, 1fr);
    min-height: 13rem;
    background: var(--page);
    border-top: 1px solid var(--rule);
  }
  .shead {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    padding: 1rem 1.1rem 0.5rem 1.4rem;
  }
  .shead .lbl {
    color: var(--ink-soft);
  }
  .qn {
    opacity: 0.6;
  }
  .trash {
    display: grid;
    place-items: center;
    width: 2.4rem;
    height: 2.4rem;
    margin-left: auto;
    border: none;
    border-radius: 999px;
    background: none;
    color: var(--ink-soft);
    cursor: pointer;
    transition:
      background-color 0.15s ease,
      opacity 0.15s ease;
  }
  .trash[disabled] {
    opacity: 0.35;
    cursor: default;
  }
  .paper {
    --line: 2.25rem;
    width: 100%;
    height: 100%;
    min-height: 9rem;
    padding: 0 1.4rem;
    border: none;
    resize: none;
    background-color: transparent;
    background-image: repeating-linear-gradient(
      to bottom,
      transparent 0 calc(var(--line) - 1px),
      color-mix(in srgb, var(--ink) 11%, transparent) calc(var(--line) - 1px) var(--line)
    );
    background-attachment: local;
    color: var(--ink);
    font-size: 1.2rem;
    line-height: var(--line);
  }
  .paper:focus {
    outline: none;
  }
  .paper:focus-visible {
    box-shadow: inset 3px 0 0 color-mix(in srgb, var(--binding) 70%, transparent);
  }
</style>
