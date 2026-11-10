<script lang="ts">
  import { formatFactor, formatGrouped, formatWords, type NumberStyle } from '$lib/core/number';
  import {
    BUCKET_LABELS,
    bucketOf,
    closerThanPercent,
    factorOf,
    sideLabel,
    sideOf,
    verdictFor
  } from '$lib/core/score';
  import type { Question } from '$lib/data/types';
  import CrowdBars from './CrowdBars.svelte';
  import LogRuler from './LogRuler.svelte';

  let {
    question,
    guess,
    numberStyle,
    crowd,
    nextLabel,
    onnext
  }: {
    question: Question;
    guess: number;
    numberStyle: NumberStyle;
    crowd: number[] | null;
    nextLabel: string;
    onnext: () => void;
  } = $props();

  const factor = $derived(factorOf(guess, question.answer));
  const side = $derived(sideOf(guess, question.answer));
  const verdict = $derived(verdictFor(factor));
  const s = $derived(sideLabel(side));
  const myBucket = $derived(bucketOf(guess, question.answer));
  const closer = $derived(crowd ? closerThanPercent(crowd, myBucket) : null);
  const u = $derived(question.unit);
  // Long answers step down in size instead of wrapping mid-number.
  const answerText = $derived(`${question.unit.prefix ?? ''}${formatGrouped(question.answer, numberStyle)}`);
  const answerSize = $derived(
    answerText.length <= 7 ? 'var(--t-2xl)' : answerText.length <= 10 ? '2.3rem' : answerText.length <= 13 ? '1.9rem' : '1.55rem'
  );

  let nextBtn: HTMLButtonElement | undefined = $state();
  $effect(() => {
    nextBtn?.focus({ preventScroll: true });
  });
</script>

<section class="reveal" aria-live="polite">
  <p class="prompt">{question.prompt}</p>

  <dl class="lines num">
    <div class="line">
      <dt>Your guess</dt>
      <dd>{u.prefix ?? ''}{formatGrouped(guess, numberStyle)}</dd>
    </div>
    <div class="line answer">
      <dt>Answer</dt>
      <dd>
        <span class="big" style="font-size:{answerSize}">{answerText}</span>
        {#if u.label}<span class="unit">{u.label}</span>{/if}
        {#if question.answer >= 1000}<span class="words">{u.prefix ?? ''}{formatWords(question.answer, numberStyle)}</span>{/if}
      </dd>
    </div>
  </dl>

  <LogRuler {guess} answer={question.answer} {numberStyle} />

  <div class="verdict tone-{verdict.tone}">
    <p class="factor num">{formatFactor(factor)}</p>
    <p class="say">
      <span class="label">{verdict.label}</span>
      {#if side !== 'exact'}
        <span class="side">{s.hi}: {s.en.toLowerCase()} by {formatFactor(factor)}</span>
      {:else}
        <span class="side">Exactly right</span>
      {/if}
    </p>
  </div>

  {#if crowd}
    <CrowdBars
      counts={crowd}
      mine={myBucket}
      labels={BUCKET_LABELS}
      caption={closer !== null ? `Closer than ${closer}% of players` : 'How everyone guessed'}
    />
  {/if}

  <div class="source">
    {#if question.note}<p>{question.note}</p>{/if}
    <p class="cite">Source: {question.source}, {question.asOf}.</p>
  </div>

  <details class="hisaab">
    <summary>How you could estimate it</summary>
    <div class="work hand">
      <p>{question.napkin.lead}</p>
      <table>
        <tbody>
          {#each question.napkin.steps as [step, val], i (i)}
            <tr><td>{step}</td><td class="val">{val}</td></tr>
          {/each}
        </tbody>
      </table>
      <p class="landed">
        Lands at about {u.prefix ?? ''}{formatWords(question.napkin.estimate, numberStyle)},
        {formatFactor(factorOf(question.napkin.estimate, question.answer))} off.
      </p>
    </div>
  </details>

  <button bind:this={nextBtn} class="btn block" onclick={onnext}>{nextLabel}</button>
</section>

<style>
  .reveal {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 1.1rem;
  }
  .prompt {
    font-size: var(--t-md);
    color: var(--ink-soft);
  }
  .lines {
    margin: 0;
    display: grid;
    gap: 0.25rem;
  }
  .line {
    display: grid;
    grid-template-columns: 5.5rem minmax(0, 1fr);
    align-items: baseline;
    gap: 0.5rem;
  }
  dt {
    font-size: var(--t-sm);
    color: var(--ink-soft);
  }
  dd {
    margin: 0;
    font-size: var(--t-lg);
  }
  .answer dd {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    column-gap: 0.45rem;
  }
  .big {
    font-family: var(--font-display);
    line-height: 1.05;
    color: var(--answer);
    white-space: nowrap;
  }
  .unit {
    font-size: var(--t-md);
  }
  .words {
    flex-basis: 100%;
    font-size: var(--t-sm);
    color: var(--ink-soft);
  }
  .verdict {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .factor {
    font-family: var(--font-display);
    font-size: var(--t-3xl);
    line-height: 1;
  }
  .say {
    display: grid;
  }
  .label {
    font-family: var(--font-display);
    font-size: var(--t-xl);
    line-height: 1.1;
  }
  .side {
    font-size: var(--t-sm);
    color: var(--ink-soft);
  }
  .tone-bullseye .factor,
  .tone-great .factor {
    color: var(--good);
  }
  .tone-good .factor {
    color: var(--accent);
  }
  .tone-meh .factor,
  .tone-far .factor {
    color: var(--warn);
  }
  .tone-wild .factor {
    color: var(--bad);
  }
  .source {
    display: grid;
    gap: 0.3rem;
    font-size: var(--t-sm);
  }
  .cite {
    color: var(--ink-soft);
  }
  .hisaab {
    background: var(--page-2);
    border-radius: 14px;
    padding: 0.55rem 0.95rem;
  }
  summary {
    cursor: pointer;
    font-weight: 600;
    padding: 0.3rem 0;
  }
  .work {
    display: grid;
    gap: 0.5rem;
    padding-top: 0.5rem;
    font-size: 1.05rem;
    color: var(--ink);
  }
  table {
    border-collapse: collapse;
    width: 100%;
  }
  td {
    padding: 0.15rem 0;
    vertical-align: top;
    line-height: 1.5rem;
  }
  .val {
    text-align: right;
    white-space: nowrap;
    padding-left: 0.75rem;
    font-weight: 700;
  }
  tr:last-child td {
    border-top: 1.5px solid currentColor;
  }
  .landed {
    font-size: 0.98rem;
    color: var(--ink-soft);
  }
</style>
