<script lang="ts">
  import { fade } from 'svelte/transition';
  import AryabhataArt from '$lib/components/landing/AryabhataArt.svelte';
  import Faq from '$lib/components/landing/Faq.svelte';
  import HowToPlay from '$lib/components/landing/HowToPlay.svelte';
  import Game from '$lib/game/Game.svelte';

  let phase = $state<'loading' | 'intro' | 'guess' | 'reveal' | 'results' | 'none'>('loading');
  let game: Game | undefined = $state();

  function playFromBottom() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    game?.play();
  }
</script>

<svelte:head>
  <title>Andaaza: the daily estimation game for India</title>
  <meta
    name="description"
    content="Three questions about India every day. Villages, votes, cricket, rockets. One guess each, scored on how close you get."
  />
  <meta property="og:title" content="Andaaza: the daily estimation game for India" />
  <meta property="og:description" content="Ek padha-likha tukka maaro. Three questions about India, one guess each." />
</svelte:head>

<div class="game">
  <Game start="intro" bind:phase bind:this={game} />
</div>

{#if phase === 'intro' || phase === 'loading'}
  <div out:fade={{ duration: 200 }}>
    <HowToPlay />

    <section class="what" aria-labelledby="what-title">
      <h2 id="what-title">What’s an andaaza?</h2>
      <div class="neel">
        <div class="copy">
          <p>
            Andaaza is a daily game of smart guessing: three questions about India, one guess each. No Googling, just
            napkin maths.
          </p>
          <p>
            Around 499 CE, Aryabhata worked out that a circle 20,000 across is about 62,832 around. He called it
            <em lang="sa">āsanna</em>, “nearly”. That’s the spirit. Good luck!
          </p>
        </div>
        <AryabhataArt />
      </div>
    </section>

    <Faq />

    <div class="end">
      <button class="pill big" onclick={playFromBottom}>Play today’s <span class="arrow" aria-hidden="true">→</span></button>
    </div>
  </div>
{/if}

<style>
  .game {
    padding-top: 0.5rem;
  }
  .what {
    padding: 4.5rem 0 0;
    display: grid;
    gap: 1rem;
    max-width: 56rem;
    margin: 0 auto;
  }
  .what h2 {
    font-family: var(--font-ui);
    font-weight: 800;
    font-size: clamp(1.9rem, 6vw, 2.4rem);
    letter-spacing: -0.02em;
  }
  .neel {
    display: grid;
    border-radius: var(--radius-lg);
    background: var(--neel);
    color: #eef0ff;
    box-shadow: 0 30px 60px -34px rgb(10 14 50 / 0.75);
    overflow: hidden;
  }
  .copy {
    display: grid;
    gap: 0.9rem;
    padding: 1.6rem 1.5rem 0.5rem;
  }
  .copy p {
    font-size: 1.08rem;
    line-height: 1.65;
    max-width: 30rem;
  }
  .neel em {
    font-style: normal;
    font-family: var(--font-hand);
    font-weight: 700;
    color: var(--hl-text);
  }
  @media (min-width: 48rem) {
    .neel {
      grid-template-columns: 1fr 1.05fr;
      align-items: end;
    }
    .copy {
      align-self: center;
      padding: 2.2rem 0 2.2rem 2.3rem;
    }
  }
  .end {
    display: grid;
    place-items: center;
    padding: 3.5rem 0 0;
  }
  .pill.big {
    background: var(--card-q1);
    color: #fff8ee;
    min-height: 3.6rem;
    padding: 0 2.4rem;
  }
</style>
