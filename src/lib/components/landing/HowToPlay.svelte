<script lang="ts">
  import Icon from '$lib/components/Icon.svelte';
  import { formatFactor } from '$lib/core/number';
  import { dayScore } from '$lib/core/score';

  // Demo data. The step-2 example is real: Qutub Minar is 72.5 m tall (ASI).
  const typedTarget = '190 crore';
  const demoFactors = [1.21, 1.8, 3.1];
  const demoTotal = dayScore(demoFactors);

  let seen = $state([false, false, false]);
  let typed = $state('');
  let shownTotal = $state(1);

  const reduced = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  function inview(node: HTMLElement, onSeen: () => void) {
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          onSeen();
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(node);
    return { destroy: () => io.disconnect() };
  }

  function startTyping() {
    seen[0] = true;
    if (reduced()) return void (typed = typedTarget);
    let n = 0;
    const id = setInterval(() => {
      n++;
      typed = typedTarget.slice(0, n);
      if (n >= typedTarget.length) clearInterval(id);
    }, 140);
  }

  function startCount() {
    seen[2] = true;
    if (reduced()) return void (shownTotal = demoTotal);
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / 900);
      shownTotal = 1 + (demoTotal - 1) * (1 - Math.pow(1 - p, 3));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  const arrow = (f: number, i: number) => (i === 1 ? '↑' : '↓');
  const emoji = (f: number) => (f <= 1.25 ? '🎯' : f <= 2 ? '🟢' : f <= 4 ? '🟡' : '🟠');
</script>

<section class="how" aria-labelledby="how-title">
  <h2 id="how-title" class="title"><span class="hl">How to play</span></h2>

  <ol>
    <li class="step" class:in={seen[0]} use:inview={startTyping}>
      <div class="copy">
        <h3><span class="hl">1. Make your guess</span></h3>
        <p>No Googling. Do the mota hisab in your head, or use the built-in calculator.</p>
      </div>
      <div class="mock m1" aria-hidden="true">
        <div class="mrow"><span>Q1 / 3</span><span class="mbrand">Andaaza</span></div>
        <p class="mq">How many cups of chai does India drink in a day?</p>
        <div class="mline"><span class="mtyped">{typed}<span class="caret"></span></span><span class="munit">cups</span></div>
        <div class="mrow mfoot">
          <span class="mcalc"><Icon name="calculator" size={20} /></span>
          <span class="mlock">Lock it in ↵</span>
        </div>
      </div>
    </li>

    <li class="step flip" class:in={seen[1]} use:inview={() => (seen[1] = true)}>
      <div class="copy">
        <h3><span class="hl">2. See how close you were</span></h3>
        <p>We show the real answer and how many times off you were. 1× is perfect.</p>
      </div>
      <div class="mock m2" aria-hidden="true">
        <div class="mrow"><span>Q2 / 3</span><span class="mbrand">Andaaza</span></div>
        <p class="mq small">How tall is the Qutub Minar?</p>
        <div class="mboxes">
          <div class="mbox"><span class="lbl">You guessed</span><strong class="num">60 m</strong></div>
          <div class="mbox ans"><span class="lbl">Answer</span><strong class="num">72.5 m</strong></div>
        </div>
        <div class="mruler"><span class="mk you"></span><span class="mk real"></span></div>
        <p class="mland"><strong class="num">1.21×</strong> Bahut badhiya</p>
      </div>
    </li>

    <li class="step" class:in={seen[2]} use:inview={startCount}>
      <div class="copy">
        <h3><span class="hl">3. Share your total</span></h3>
        <p>Your day’s total lands on a card made for the group chat.</p>
      </div>
      <div class="mock m3" aria-hidden="true">
        <div class="mrow"><span class="mbrand">Andaaza</span><span>No. 7</span></div>
        <span class="lbl">Score</span>
        <p class="mtotal num">{formatFactor(shownTotal)}</p>
        <span class="mtag">Accha andaaza</span>
        <ul class="mlist num">
          {#each demoFactors as f, i (i)}
            <li><span>{emoji(f)} Q{i + 1}</span><span>{arrow(f, i)} {formatFactor(f)}</span></li>
          {/each}
        </ul>
        <div class="mrow mbtns"><span class="mshare">Share card</span><span class="mcopy">Copy text</span></div>
      </div>
    </li>
  </ol>
</section>

<style>
  .how {
    padding: 4rem var(--gutter) 1rem;
    display: grid;
    gap: 2.5rem;
  }
  .title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 7vw, 2.6rem);
    text-align: center;
  }
  ol {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 4rem;
  }
  .step {
    display: grid;
    gap: 1.75rem;
    justify-items: center;
    text-align: center;
  }
  .copy {
    display: grid;
    gap: 0.6rem;
    max-width: 24rem;
  }
  h3 {
    font-family: var(--font-ui);
    font-weight: 700;
    font-size: 1.45rem;
    letter-spacing: -0.01em;
  }
  .copy p {
    color: var(--ink-soft);
  }
  @media (min-width: 48rem) {
    .step {
      grid-template-columns: 1fr 1fr;
      align-items: center;
      justify-items: start;
      text-align: left;
      gap: 3rem;
    }
    .step.flip .copy {
      order: 2;
    }
  }

  /* Mock cards: fixed sindoor / neel / haldi so they pop on every palette. */
  .mock {
    width: min(100%, 21rem);
    padding: 1.1rem 1.2rem 1.25rem;
    border-radius: 22px;
    display: grid;
    gap: 0.75rem;
    text-align: left;
    box-shadow: 0 24px 40px -22px rgb(0 0 0 / 0.55);
    opacity: 0;
    transform: translateY(24px) rotate(0deg);
    transition:
      opacity 0.5s ease,
      transform 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .in .mock {
    opacity: 1;
  }
  .in .m1 {
    transform: rotate(3deg);
  }
  .in .m2 {
    transform: rotate(-3deg);
  }
  .in .m3 {
    transform: rotate(2.5deg);
  }
  .mock:hover {
    transform: rotate(0deg) scale(1.02) !important;
  }
  .mrow {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: var(--t-xs);
    font-weight: 700;
    opacity: 0.9;
  }
  .mbrand {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 0.95rem;
  }
  .mq {
    font-weight: 700;
    font-size: 1.3rem;
    line-height: 1.2;
  }
  .mq.small {
    font-size: 1.1rem;
  }
  .m1 {
    background: var(--card-q1);
    color: #fff7ec;
  }
  .mline {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.55rem 0.9rem;
    border-radius: 14px;
    background: rgb(255 255 255 / 0.16);
    min-height: 3.2rem;
  }
  .mtyped {
    font-weight: 800;
    font-size: 1.7rem;
    line-height: 1;
  }
  .caret {
    display: inline-block;
    width: 2px;
    height: 1.4rem;
    margin-left: 2px;
    background: currentColor;
    vertical-align: -0.1rem;
    animation: blink 1s steps(1) infinite;
  }
  @keyframes blink {
    50% {
      opacity: 0;
    }
  }
  .munit {
    font-size: var(--t-sm);
    opacity: 0.85;
  }
  .mfoot {
    margin-top: 0.25rem;
  }
  .mcalc {
    display: grid;
    place-items: center;
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 999px;
    border: 2px solid currentColor;
  }
  .mlock {
    padding: 0.5rem 1rem;
    border-radius: 999px;
    background: #fff7ec;
    color: var(--card-q1);
    font-size: 0.72rem;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  .m2 {
    background: var(--card-q2);
    color: #eef0ff;
  }
  .mboxes {
    display: grid;
    gap: 0.5rem;
  }
  .mbox {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 0.5rem 0.75rem;
    border-radius: 12px;
    background: rgb(255 255 255 / 0.12);
    font-size: var(--t-sm);
  }
  .mbox strong {
    font-weight: 800;
    font-size: 1.35rem;
  }
  .mbox.ans {
    background: var(--chalk);
    color: var(--deep);
    box-shadow: inset 0 0 0 3px var(--haldi);
  }
  .mruler {
    position: relative;
    height: 1.4rem;
    border-bottom: 2px solid rgb(255 255 255 / 0.6);
  }
  .mk {
    position: absolute;
    bottom: -2px;
    width: 4px;
    height: 1.3rem;
    border-radius: 2px;
    transition: left 1s 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  .mk.you {
    left: 38%;
    background: #fff;
  }
  .mk.real {
    left: 38%;
    background: var(--haldi);
  }
  .in .mk.real {
    left: 62%;
  }
  .mland {
    font-size: var(--t-sm);
  }
  .mland strong {
    font-weight: 800;
    font-size: 1.8rem;
    color: var(--hl-text);
    margin-right: 0.35rem;
  }

  .m3 {
    background: var(--card-done);
    color: var(--deep);
  }
  .mtotal {
    font-weight: 800;
    font-size: 3.4rem;
    line-height: 0.95;
    letter-spacing: -0.04em;
  }
  .mtag {
    justify-self: start;
    padding: 0.15rem 0.7rem;
    border-radius: 999px;
    background: var(--deep);
    color: var(--haldi);
    font-size: var(--t-xs);
    font-weight: 700;
  }
  .mlist {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
  }
  .mlist li {
    display: flex;
    justify-content: space-between;
    padding: 0.35rem 0;
    border-bottom: 1px solid rgb(27 26 46 / 0.18);
    font-size: var(--t-sm);
    font-weight: 600;
  }
  .mbtns {
    justify-content: flex-start;
    gap: 0.5rem;
    opacity: 1;
  }
  .mshare,
  .mcopy {
    padding: 0.4rem 0.9rem;
    border-radius: 999px;
    border: 2px solid var(--deep);
    font-size: 0.68rem;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }
  .mshare {
    background: var(--deep);
    color: var(--haldi);
  }
</style>
