<script lang="ts">
  import { base } from '$app/paths';
  import { onMount } from 'svelte';
  import Countdown from '$lib/components/Countdown.svelte';
  import { formatLongDate, istDateKey, puzzleNumber } from '$lib/core/date';
  import { formatFactor } from '$lib/core/number';
  import { dayScore, factorOf } from '$lib/core/score';
  import { loadGame } from '$lib/state/storage';

  let today = $state('');
  let status = $state<'new' | 'started' | 'done'>('new');
  let score = $state<number | null>(null);

  onMount(() => {
    today = istDateKey();
    const g = loadGame(today);
    if (g?.completed) {
      status = 'done';
      score = dayScore(g.guesses.map((x, i) => factorOf(x, g.answers[i])));
    } else if (g && g.guesses.length) status = 'started';
  });

  const no = $derived(today ? puzzleNumber(today) : null);

  const tiers = [
    ['1×', 'Ekdum sahi!', 'Spot on'],
    ['up to 1.5×', 'Bahut badhiya', 'Excellent'],
    ['up to 2×', 'Accha andaaza', 'Good guess'],
    ['up to 5×', 'Thoda door', 'A bit off'],
    ['up to 10×', 'Kaafi door', 'Quite far'],
    ['beyond 10×', 'Arre yaar!', 'Way off']
  ];
</script>

<svelte:head>
  <title>Andaaza: the daily estimation game for India</title>
  <meta
    name="description"
    content="Three questions about India every day. Villages, votes, chai, cricket, rockets. One guess each, scored on how close you get."
  />
  <meta property="og:title" content="Andaaza: the daily estimation game for India" />
  <meta property="og:description" content="Three questions about India every day. One guess each. How close can you get?" />
</svelte:head>

<section class="hero">
  <h1>Guess the big numbers of India.</h1>
  <p class="lede">
    Three questions a day, from village counts to IPL sixes. No searching, just your andaaza. We tell you how many
    times off you were.
  </p>

  <div class="cta">
    {#if status === 'done' && score !== null}
      <a class="btn" href="{base}/play">See today’s total: {formatFactor(score)}</a>
    {:else}
      <a class="btn" href="{base}/play">{status === 'started' ? 'Continue' : 'Play'} {no ? `No. ${no}` : 'today’s puzzle'}</a>
    {/if}
    <p class="when">
      {#if today}{formatLongDate(today)}{/if}
    </p>
  </div>
  {#if status === 'done'}<Countdown />{/if}
</section>

<section class="example ledger" aria-labelledby="ex-title">
  <h2 id="ex-title">Every answer is just a little hisaab</h2>
  <p class="q">How many cups of chai does India drink in a day?</p>
  <table class="hand">
    <tbody>
      <tr><td>People in India</td><td>140 crore</td></tr>
      <tr><td>Who drink tea daily</td><td>~ 2 in 3</td></tr>
      <tr><td>Cups each</td><td>~ 2</td></tr>
      <tr class="sum"><td>140 crore × ⅔ × 2</td><td>≈ 190 crore cups</td></tr>
    </tbody>
  </table>
  <p class="aside">Rough is fine. Being within 2× of the real answer is a good guess.</p>
</section>

<section class="how" aria-labelledby="how-title">
  <h2 id="how-title">How to play</h2>
  <ol>
    <li>
      <h3>Make one guess per question</h3>
      <p>Type it any way you like: 45000, 4.5 lakh, 2 crore, 3 million. A calculator and rough-work pad are built in.</p>
    </li>
    <li>
      <h3>See how far off you were</h3>
      <p>
        Your score is how many times off you were. Guess 50 when the answer is 100 and you are 2× off. Guess 200 and you
        are also 2× off. 1× is perfect.
      </p>
    </li>
    <li>
      <h3>Add up the day and share it</h3>
      <p>Your day’s total combines all three. Share the card in your group and compare.</p>
    </li>
  </ol>
</section>

<section class="tiers" aria-labelledby="tiers-title">
  <h2 id="tiers-title">What your score means</h2>
  <table>
    <tbody>
      {#each tiers as [range, hi, en] (hi)}
        <tr>
          <td class="num">{range}</td>
          <td class="hi">{hi}</td>
          <td class="en">{en}</td>
        </tr>
      {/each}
    </tbody>
  </table>
  <p class="aside">
    A single very wild guess counts as at most 1,000× off, so one bad question never ruins your whole day.
  </p>
</section>

<section class="faq" aria-labelledby="faq-title">
  <h2 id="faq-title">Questions people ask</h2>
  <details>
    <summary>When does the new puzzle come out?</summary>
    <p>Every night at 12:00 midnight India time.</p>
  </details>
  <details>
    <summary>Can I play puzzles I missed?</summary>
    <p>Yes. The <a href="{base}/archive">archive</a> has every puzzle since launch. Only the daily puzzle counts toward your streak.</p>
  </details>
  <details>
    <summary>Is using the calculator cheating?</summary>
    <p>No. Working it out is the whole point. Looking up the answer is the only thing that spoils it.</p>
  </details>
  <details>
    <summary>Where do the answers come from?</summary>
    <p>
      Government reports, census data, official bodies and reliable records. Each answer names its source and year. Some
      numbers are estimates themselves, and we say so.
    </p>
  </details>
  <details>
    <summary>Can I suggest a question?</summary>
    <p>Yes. <a href="{base}/submit">Send us your question</a>, ideally with a source for the answer.</p>
  </details>
</section>

<style>
  .hero,
  .how,
  .tiers,
  .faq {
    padding-inline: var(--gutter);
  }
  .hero {
    padding-top: 1.75rem;
    padding-bottom: 2.25rem;
    display: grid;
    gap: 1rem;
  }
  h1 {
    font-size: clamp(2.6rem, 11vw, 4.4rem);
    line-height: 1.02;
    max-width: 12ch;
    color: var(--ink);
  }
  .lede {
    font-size: var(--t-lg);
    line-height: 1.45;
    max-width: 32rem;
    color: var(--ink-soft);
  }
  .cta {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex-wrap: wrap;
    margin-top: 0.5rem;
  }
  .cta .btn {
    font-size: var(--t-lg);
    min-height: 3.4rem;
    padding-inline: 1.75rem;
  }
  .when {
    color: var(--ink-soft);
    font-size: var(--t-sm);
  }
  .example {
    padding-top: 1.6rem;
    padding-bottom: 1.6rem;
    border-top: 6px solid var(--binding);
    border-bottom: 1px solid var(--rule);
    display: grid;
    gap: 0.75rem;
  }
  .example h2 {
    font-size: var(--t-xl);
  }
  .example .q {
    font-weight: 600;
  }
  .example table {
    border-collapse: collapse;
    font-size: 1.2rem;
    max-width: 26rem;
  }
  .example td {
    height: var(--line);
    padding: 0;
    vertical-align: bottom;
  }
  .example td:last-child {
    text-align: right;
    font-weight: 700;
    padding-left: 1rem;
    white-space: nowrap;
  }
  .example .sum td {
    border-bottom: 3px double var(--ink);
  }
  .aside {
    font-size: var(--t-sm);
    color: var(--ink-soft);
  }
  .how,
  .tiers,
  .faq {
    padding-top: 2.5rem;
    display: grid;
    gap: 1rem;
  }
  .how h2,
  .tiers h2,
  .faq h2 {
    font-size: var(--t-xl);
  }
  .how ol {
    margin: 0;
    padding: 0;
    list-style: none;
    counter-reset: step;
    display: grid;
    gap: 1.25rem;
  }
  .how li {
    counter-increment: step;
    display: grid;
    grid-template-columns: 2.5rem 1fr;
    column-gap: 0.75rem;
  }
  .how li::before {
    content: counter(step);
    grid-row: span 2;
    font-family: var(--font-display);
    font-size: 2.2rem;
    line-height: 1;
    color: var(--margin);
  }
  .how h3 {
    font-family: var(--font-ui);
    font-weight: 600;
    font-size: var(--t-lg);
  }
  .how p {
    color: var(--ink-soft);
    max-width: 34rem;
  }
  .tiers table {
    border-collapse: collapse;
    width: 100%;
    max-width: 30rem;
  }
  .tiers td {
    padding: 0.45rem 0.5rem 0.45rem 0;
    border-bottom: 1px solid var(--rule);
  }
  .tiers .hi {
    font-family: var(--font-display);
    font-size: var(--t-lg);
  }
  .tiers .en {
    color: var(--ink-soft);
    font-size: var(--t-sm);
  }
  details {
    border-bottom: 1px solid var(--rule);
    padding: 0.6rem 0;
  }
  summary {
    cursor: pointer;
    font-weight: 600;
  }
  details p {
    padding-top: 0.4rem;
    color: var(--ink-soft);
    max-width: 36rem;
  }
</style>
