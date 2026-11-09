<script lang="ts">
  import { base } from '$app/paths';
  import { LAUNCH_DATE, formatLongDate } from '$lib/core/date';
  import { online } from '$lib/state/online';
</script>

<svelte:head>
  <title>About Andaaza</title>
  <meta name="description" content="What Andaaza is, how scoring works and where the answers come from." />
</svelte:head>

<article class="page">
  <h1>About Andaaza</h1>

  <p>
    <span lang="hi">अंदाज़ा</span> means a rough estimate: the number you arrive at when you can’t look it up but can
    reason your way close. Every day Andaaza asks three questions about India. You guess, see the real answer, and find
    out how many times off you were.
  </p>

  <h2>Why estimate?</h2>
  <p>
    The physicist Enrico Fermi was famous for questions like “how many piano tuners are there in Chicago?”, which
    sound impossible until you break them into smaller guesses you <em>can</em> make. Indian kitchens, shops and offices
    have always done the same thing as everyday hisaab. Estimating like this is how good planners, journalists and
    founders sanity-check numbers.
  </p>

  <h2>How scoring works</h2>
  <p>
    For each question we divide the bigger number by the smaller one, your guess or the answer. Guessing half or double
    both count as 2× off. Your day’s total is the geometric mean of the three questions, so one question being 10×
    off counts the same whether you guessed too high or too low. Any single guess counts as at most 1,000× off.
  </p>

  <h2>Where the answers come from</h2>
  <p>
    Census data, government ministries, the Election Commission, ISRO, official sports records and similar bodies.
    Each answer names its source and the year it refers to. Some figures, such as crowd counts, are estimates themselves,
    and the answer note says so. If you spot an error, <a href="{base}/submit">tell us</a>.
  </p>

  <h2>Your data</h2>
  <p>
    Your games, stats and settings are stored only in this browser.
    {#if online}
      To show how other players guessed, each locked guess is also sent with a random ID that isn’t linked to your
      name, email or device. A name is only sent if you add one on the leaderboard page.
    {:else}
      Nothing is sent anywhere.
    {/if}
  </p>

  <p class="small">Puzzle No. 1 was published on {formatLongDate(LAUNCH_DATE)}.</p>
</article>

<style>
  .page {
    padding: 0.75rem var(--gutter);
    display: grid;
    gap: 0.9rem;
    max-width: 38rem;
  }
  h1 {
    font-size: var(--t-2xl);
  }
  h2 {
    font-size: var(--t-xl);
    margin-top: 0.8rem;
  }
  p {
    line-height: 1.6;
  }
  .small {
    font-size: var(--t-sm);
    color: var(--ink-soft);
    margin-top: 1rem;
  }
</style>
