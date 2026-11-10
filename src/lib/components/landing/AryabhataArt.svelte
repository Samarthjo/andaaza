<!--
  Aryabhata artwork by Sci Shakti, used with permission (watermark kept, credit shown).
  The black background is blended into the indigo card with mix-blend-mode: screen.
  Chalk doodles: Aryabhatiya, Ganitapada 10: (4 + 100) × 8 + 62,000 is "nearly" (āsanna)
  the circumference of a circle 20,000 across, i.e. π ≈ 3.1416.
-->
<script lang="ts">
  import { base } from '$app/paths';
</script>

<figure class="art">
  <img
    src="{base}/aryabhatta.jpg"
    alt="Illustration of Aryabhata, the 5th-century Indian mathematician and astronomer"
    width="802"
    height="760"
    loading="lazy"
    decoding="async"
  />
  <svg class="chalk" viewBox="0 0 802 760" aria-hidden="true">
    <defs>
      <filter id="chalk-ary" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed="4" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
    <g filter="url(#chalk-ary)" fill="none" stroke="#f4f0e4" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" opacity="0.92">
      <circle cx="140" cy="215" r="92" />
      <path d="M48 215 H232" stroke-dasharray="10 9" />
      <path d="M48 205 v20 M232 205 v20" />
      <path d="M92 132 q-30 -36 -10 -72" />
      <path d="M74 66 l6 -10 l8 10" />
      <path d="M590 214 q-52 10 -104 -2" />
      <path d="M498 202 l-14 9 l15 6" />
    </g>
    <g filter="url(#chalk-ary)" fill="#f4f0e4" font-family="Kalam, 'Comic Neue', cursive" opacity="0.95">
      <text x="140" y="203" font-size="30" text-anchor="middle">20,000</text>
      <text x="26" y="44" font-size="32">≈ 62,832 around</text>
      <text x="520" y="70" font-size="44" font-weight="700">π ≈ 3.1416</text>
      <text x="524" y="112" font-size="30">āsanna = nearly</text>
      <text x="604" y="170" font-size="30" transform="rotate(-6 604 170)">the OG</text>
      <text x="580" y="206" font-size="30" transform="rotate(-6 580 206)">andaaza-baaz</text>
    </g>
  </svg>
  <figcaption>Art: Sci Shakti</figcaption>
</figure>

<style>
  .art {
    position: relative;
    margin: 0;
  }
  img {
    display: block;
    width: 100%;
    height: auto;
    mix-blend-mode: screen;
    filter: contrast(1.05);
  }
  .chalk {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  figcaption {
    position: absolute;
    left: 1rem;
    bottom: 0.6rem;
    font-size: 0.72rem;
    opacity: 0.75;
  }
</style>
