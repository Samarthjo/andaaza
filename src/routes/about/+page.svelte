<script lang="ts">
  import { base } from '$app/paths';
  import { LAUNCH_DATE, formatLongDate } from '$lib/core/date';
  import { online } from '$lib/state/online';
</script>

<svelte:head>
  <title>About Andaaza</title>
  <meta name="description" content="How Andaaza works: scoring, sources and your data." />
</svelte:head>

<article class="page">
  <h1>About</h1>

  <section class="surface">
    <h2>Scoring</h2>
    <p>
      Each guess scores how many times off it was: the bigger number divided by the smaller. Half or double are both
      2×. Your day’s total is the geometric mean of the three, and one guess counts as at most 1,000×.
    </p>
  </section>

  <section class="surface">
    <h2>Sources</h2>
    <p>
      Answers come from census data, ministries, the Election Commission, ISRO and official sports records. Each one
      names its source and year. Spot an error? <a href="{base}/submit">Tell us</a>.
    </p>
  </section>

  <section class="surface">
    <h2>Your data</h2>
    <p>
      Games and stats stay in this browser.
      {#if online}
        To show how others guessed, each guess is also sent with a random ID, not your name or email.
      {:else}
        Nothing is sent anywhere.
      {/if}
    </p>
  </section>

  <p class="small">Puzzle No. 1: {formatLongDate(LAUNCH_DATE)}. Icons by Tabler Icons (MIT).</p>
</article>

<style>
  .page {
    max-width: 40rem;
    margin: 0 auto;
    padding: 0.75rem var(--gutter);
    display: grid;
    gap: 1rem;
  }
  h1 {
    font-size: var(--t-2xl);
  }
  section {
    padding: 1.1rem 1.25rem 1.25rem;
    display: grid;
    gap: 0.4rem;
  }
  h2 {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: var(--t-lg);
  }
  p {
    line-height: 1.6;
  }
  .small {
    font-size: var(--t-xs);
    color: var(--ink-soft);
  }
</style>
