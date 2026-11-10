<script lang="ts">
  import { base } from '$app/paths';
  import Aryabhata from '$lib/components/landing/Aryabhata.svelte';
  import Faq from '$lib/components/landing/Faq.svelte';
  import HeroCard from '$lib/components/landing/HeroCard.svelte';
  import HowToPlay from '$lib/components/landing/HowToPlay.svelte';
</script>

<svelte:head>
  <title>Andaaza: the daily estimation game for India</title>
  <meta
    name="description"
    content="Three questions about India every day. Villages, votes, cricket, rockets. One guess each, scored on how close you get."
  />
  <meta property="og:title" content="Andaaza: the daily estimation game for India" />
  <meta property="og:description" content="Three questions about India every day. One guess each. How close can you get?" />
</svelte:head>

<section class="hero">
  <h1>Ek andaaza <span class="hand">lagao.</span></h1>
  <p class="sub">Three questions about India. One guess each.</p>
  <div class="hero-card"><HeroCard /></div>
</section>

<HowToPlay />

<section class="what" aria-labelledby="what-title">
  <h2 id="what-title">What’s an andaaza?</h2>
  <div class="neel">
    <p>
      A guess you can reason out. Around 499 CE, Aryabhata worked out that a circle 20,000 across is about 62,832
      around. That is π ≈ 3.1416, and he called it <em lang="sa">āsanna</em>: nearly.
    </p>
    <p>Three questions about India, every day. How close can you get?</p>
    <div class="art"><Aryabhata /></div>
  </div>
</section>

<Faq />

<div class="end">
  <a class="btn big" href="{base}/play">Play today’s puzzle</a>
</div>

<style>
  .hero {
    padding: 1.5rem var(--gutter) 1rem;
    display: grid;
    gap: 0.75rem;
    justify-items: center;
    text-align: center;
  }
  h1 {
    font-size: clamp(2.7rem, 12vw, 4.6rem);
    line-height: 1;
    letter-spacing: -0.01em;
    color: var(--ink);
  }
  h1 .hand {
    font-weight: 700;
    color: var(--binding);
  }
  .sub {
    color: var(--ink-soft);
    font-size: var(--t-lg);
  }
  .hero-card {
    width: min(100%, 34rem);
    margin-top: 1.25rem;
    text-align: left;
  }

  .what {
    padding: 4rem var(--gutter) 0;
    display: grid;
    gap: 1rem;
    max-width: 52rem;
    margin: 0 auto;
    width: 100%;
  }
  .what h2 {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: clamp(1.9rem, 6vw, 2.3rem);
    letter-spacing: -0.02em;
  }
  .neel {
    display: grid;
    gap: 0.9rem;
    padding: 1.5rem 1.4rem 0;
    border-radius: var(--radius-lg);
    background: var(--neel);
    color: #eef0ff;
    box-shadow: 0 24px 50px -26px rgb(10 14 50 / 0.7);
    overflow: hidden;
  }
  .neel p {
    font-size: 1.1rem;
    line-height: 1.6;
    max-width: 30rem;
  }
  .neel em {
    font-style: normal;
    font-family: var(--font-hand);
    font-weight: 700;
    color: var(--haldi);
  }
  .art {
    margin: 0.25rem -1.4rem 0;
  }
  @media (min-width: 48rem) {
    .neel {
      grid-template-columns: 1fr 1.1fr;
      grid-template-rows: auto auto 1fr;
      column-gap: 1rem;
      padding: 2rem 0 0 2rem;
    }
    .neel p {
      grid-column: 1;
    }
    .art {
      grid-column: 2;
      grid-row: 1 / span 3;
      align-self: end;
      margin: 0;
    }
  }

  .end {
    display: grid;
    place-items: center;
    padding: 3.5rem var(--gutter) 0;
  }
  .btn.big {
    min-height: 3.5rem;
    padding-inline: 2rem;
    font-size: var(--t-lg);
    box-shadow: var(--shadow);
  }
</style>
