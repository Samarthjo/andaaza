<script lang="ts">
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import Icon from '$lib/components/Icon.svelte';
  import { formatCompact, formatFactor, formatGrouped, formatWords, type NumberStyle } from '$lib/core/number';
  import { closerThanPercent, factorOf, guessBin, guessPosition, sideOf, verdictFor } from '$lib/core/score';
  import type { Question } from '$lib/data/types';
  import CrowdChart from './CrowdChart.svelte';
  import NapkinPanel from './NapkinPanel.svelte';

  let {
    question,
    guess,
    numberStyle,
    crowd,
    crowdReal,
    nextLabel,
    onnext,
    oncalc
  }: {
    question: Question;
    guess: number;
    numberStyle: NumberStyle;
    /** Chart counts (real guesses topped up with sample ones). */
    crowd: number[] | null;
    /** Real guesses only: "closer than X%" never counts samples. */
    crowdReal: number[] | null;
    nextLabel: string;
    onnext: () => void;
    oncalc: () => void;
  } = $props();

  const factor = $derived(factorOf(guess, question.answer));
  const side = $derived(sideOf(guess, question.answer));
  const sideText = $derived(side === 'high' ? 'Too high' : side === 'low' ? 'Too low' : 'Spot on');
  const closer = $derived(crowdReal ? closerThanPercent(crowdReal, guessBin(guess, question.answer)) : null);
  const sampled = $derived(!!crowd && !!crowdReal && crowd.reduce((a, b) => a + b, 0) > crowdReal.reduce((a, b) => a + b, 0));
  const u = $derived(question.unit);
  const answerText = $derived(`${u.prefix ?? ''}${formatGrouped(question.answer, numberStyle)}`);
  const guessText = $derived(`${u.prefix ?? ''}${formatGrouped(guess, numberStyle)}`);
  // Long numbers step down in size instead of wrapping mid-number.
  const fit = (t: string) => (t.length <= 9 ? undefined : t.length <= 12 ? '2.05rem' : t.length <= 15 ? '1.7rem' : '1.4rem');
  const axis = $derived([
    formatCompact(question.answer / 10, numberStyle),
    formatCompact(question.answer, numberStyle),
    formatCompact(question.answer * 10, numberStyle)
  ]);

  // Count the factor up so the result lands with a little drama.
  let shown = $state(1);
  let napkinOpen = $state(false);
  let nextBtn: HTMLButtonElement | undefined = $state();
  onMount(() => {
    const target = Number.isFinite(factor) ? factor : 1000;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      shown = target;
      return;
    }
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      shown = Math.exp(Math.log(target) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    setTimeout(() => nextBtn?.focus({ preventScroll: true }), 50);
    return () => cancelAnimationFrame(raf);
  });
</script>

<div class="reveal">
  <p class="visually-hidden" aria-live="polite">
    Answer {answerText} {u.label}. You were {formatFactor(factor)} off, {sideText.toLowerCase()}.
  </p>
  <div class="boxes">
    <div class="gbox" in:fly={{ y: 14, duration: 320, delay: 60 }}>
      <span class="lbl">You guessed</span>
      <strong class="num" style:font-size={fit(guessText)}>{guessText}</strong>
    </div>
    <div class="abox" in:fly={{ y: 18, duration: 380, delay: 180 }}>
      <span class="lbl">Answer</span>
      <strong class="num" style:font-size={fit(answerText)}>{answerText}</strong>
      <span class="aunit">
        {u.label}{#if question.answer >= 1000}{u.label ? ' · ' : ''}{u.prefix ?? ''}{formatWords(question.answer, numberStyle)}{/if}
      </span>
      <span class="src">Source: {question.source}, {question.asOf}</span>
    </div>
  </div>

  <div class="split" in:fly={{ y: 14, duration: 320, delay: 300 }}>
    <div class="landed">
      <span class="lbl">You landed</span>
      <p class="factor num">{formatFactor(shown)}</p>
      <p class="side">{sideText}</p>
      <p class="sub">
        {#if closer !== null}closer than {closer}% of players{:else}{verdictFor(factor).label}{/if}
      </p>
    </div>
    <div class="crowd">
      <span class="lbl">How everyone guessed</span>
      <CrowdChart kind="guess" counts={crowd} you={guessPosition(guess, question.answer)} labels={axis} sampled={sampled || (!!crowd && !crowdReal)} />
    </div>
  </div>

  <div class="foot">
    <button type="button" class="round-btn" onclick={oncalc} aria-label="Open calculator">
      <Icon name="calculator" size={22} />
    </button>
    <NapkinPanel {question} bind:open={napkinOpen} />
    <button bind:this={nextBtn} class="pill next" onclick={onnext}>{nextLabel} <span class="arrow" aria-hidden="true">→</span></button>
  </div>
</div>

<style>
  .reveal {
    display: grid;
    gap: 1.4rem;
    padding-top: 1.1rem;
  }
  .boxes {
    display: grid;
    gap: 0.9rem;
  }
  @media (min-width: 40rem) {
    .boxes {
      grid-template-columns: 1fr 1fr;
    }
  }
  .gbox,
  .abox {
    display: grid;
    align-content: start;
    gap: 0.35rem;
    padding: 1.1rem 1.25rem 1.25rem;
    border-radius: 20px;
    min-width: 0;
  }
  .gbox {
    background: color-mix(in srgb, #000 14%, transparent);
  }
  .gbox .lbl,
  .abox .lbl {
    opacity: 0.8;
  }
  strong {
    font-family: var(--font-ui);
    font-weight: 800;
    font-size: clamp(1.9rem, 6.5vw, 2.6rem);
    line-height: 1.05;
    letter-spacing: -0.02em;
    white-space: nowrap;
  }
  .abox {
    background: #fffaf0;
    color: #1b1a2e;
    box-shadow:
      inset 0 0 0 4px var(--haldi),
      0 18px 30px -18px rgb(0 0 0 / 0.55);
  }
  .aunit {
    font-weight: 700;
    color: #4a4a5e;
  }
  .src {
    margin-top: 0.4rem;
    font-size: 0.86rem;
    color: #5b5b6e;
  }
  .split {
    display: grid;
    gap: 1.25rem;
  }
  @media (min-width: 40rem) {
    .split {
      grid-template-columns: minmax(0, 0.8fr) 1px minmax(0, 1.5fr);
      gap: 1.75rem;
    }
    .split::before {
      content: '';
      grid-column: 2;
      grid-row: 1;
      background: color-mix(in srgb, currentColor 30%, transparent);
    }
    .landed {
      grid-column: 1;
      grid-row: 1;
    }
    .crowd {
      grid-column: 3;
      grid-row: 1;
    }
  }
  .landed {
    display: grid;
    align-content: start;
    gap: 0.15rem;
  }
  .factor,
  .side {
    font-family: var(--font-ui);
    font-weight: 800;
    font-size: clamp(2.4rem, 8vw, 3.3rem);
    line-height: 1;
    letter-spacing: -0.03em;
    color: var(--hl-text);
  }
  .factor {
    margin-top: 0.4rem;
  }
  .sub {
    margin-top: 0.6rem;
    font-weight: 700;
    font-size: 1rem;
  }
  .crowd {
    display: grid;
    gap: 0.2rem;
    min-width: 0;
  }
  .foot {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
  }
  .next {
    flex: 1 1 100%;
  }
  @media (min-width: 40rem) {
    .next {
      flex: 0 0 auto;
    }
  }
</style>
