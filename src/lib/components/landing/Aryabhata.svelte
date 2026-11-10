<!--
  Original illustration: Aryabhata (476–550 CE) sketching a circle in chalk.
  Aryabhatiya, Ganitapada 10: "Add 4 to 100, multiply by 8 and add 62,000: that is
  nearly (āsanna) the circumference of a circle 20,000 across", i.e. π ≈ 3.1416.
  No portrait of Aryabhata survives, so this is a stylised figure, not a likeness.
-->
<svg
  viewBox="0 0 400 320"
  role="img"
  aria-labelledby="ary-title"
  xmlns="http://www.w3.org/2000/svg"
  class="ary"
>
  <title id="ary-title">Illustration of Aryabhata drawing a circle in chalk, next to his rule for π</title>
  <defs>
    <filter id="chalk" x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" xChannelSelector="R" yChannelSelector="G" result="d" />
      <feComponentTransfer in="n" result="grain"><feFuncA type="table" tableValues="0.55 1" /></feComponentTransfer>
      <feComposite in="d" in2="grain" operator="in" />
    </filter>
    <filter id="sticker" x="-10%" y="-10%" width="120%" height="120%">
      <feMorphology in="SourceAlpha" operator="dilate" radius="5" result="fat" />
      <feFlood flood-color="#f7f2e6" />
      <feComposite in2="fat" operator="in" result="outline" />
      <feDropShadow dx="0" dy="6" stdDeviation="6" flood-color="#0b0f33" flood-opacity="0.45" in="outline" result="shadowed" />
      <feMerge><feMergeNode in="shadowed" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
    <pattern id="dots" width="5" height="5" patternUnits="userSpaceOnUse">
      <circle cx="1.5" cy="1.5" r="0.9" fill="#000" opacity="0.13" />
    </pattern>
  </defs>

  <!-- Chalk doodles -->
  <g filter="url(#chalk)" fill="none" stroke="#f4f0e4" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="150" cy="168" r="90" />
    <path d="M62 168 H238" stroke-dasharray="7 6" />
    <path d="M62 160 v16 M238 160 v16" />
    <path d="M84 98 q-26 -30 -6 -54" />
    <path d="M78 44 l-2 10 l9 -5" />
    <path d="M356 60 q-2 18 -24 30" />
    <path d="M338 84 l-6 6 l9 1" />
    <path d="M20 292 h132" stroke-width="2" />
  </g>
  <g filter="url(#chalk)" fill="#f4f0e4" font-family="Kalam, 'Comic Neue', cursive">
    <text x="150" y="158" font-size="19" text-anchor="middle">20,000</text>
    <text x="30" y="34" font-size="20">≈ 62,832 around</text>
    <text x="22" y="286" font-size="17">(4 + 100) × 8 + 62,000</text>
    <text x="22" y="312" font-size="21" font-weight="700">π ≈ 3.1416</text>
    <text x="196" y="30" font-size="21" font-weight="700">āsanna</text>
    <text x="198" y="50" font-size="15">= nearly</text>
    <text x="318" y="30" font-size="17" transform="rotate(-5 318 30)">the OG</text>
    <text x="300" y="50" font-size="17" transform="rotate(-5 300 50)">andaaza-baaz</text>
  </g>

  <!-- Stylised figure with a cut-out sticker edge -->
  <g filter="url(#sticker)">
    <!-- raised arm holding chalk to the circle -->
    <path d="M276 262 Q 236 236 232 196 Q 230 168 238 146" fill="none" stroke="#b9794a" stroke-width="24" stroke-linecap="round" />
    <path d="M262 232 q 8 -6 16 -2" fill="none" stroke="#e8b04a" stroke-width="5" stroke-linecap="round" />
    <circle cx="239" cy="140" r="12.5" fill="#c4834f" />
    <rect x="231" y="122" width="7" height="16" rx="2" fill="#fbfaf4" transform="rotate(28 234 130)" />
    <!-- torso -->
    <path d="M244 320 C 246 274 262 244 298 234 L 330 234 C 362 240 388 252 398 268 L 400 320 Z" fill="#b9794a" />
    <!-- angavastram (shawl) over the far shoulder -->
    <path d="M330 234 C 360 238 388 250 398 266 L 400 320 L 328 320 C 344 290 344 258 330 234 Z" fill="#e8a33a" />
    <path d="M396 262 C 362 274 314 296 270 320 L 312 320 C 346 300 378 288 400 284 Z" fill="#d48a22" />
    <path d="M300 320 C 330 302 360 290 392 280" fill="none" stroke="#f6d27a" stroke-width="3" />
    <!-- neck -->
    <path d="M300 204 h28 v34 q-14 8 -28 0 z" fill="#a96b40" />
    <!-- head -->
    <ellipse cx="314" cy="168" rx="31" ry="38" fill="#c4834f" />
    <ellipse cx="344" cy="172" rx="6" ry="10" fill="#b5754a" />
    <!-- hair and top knot -->
    <path d="M283 166 C 280 128 302 116 318 116 C 340 116 350 134 346 160 C 340 140 330 132 316 132 C 300 132 290 142 283 166 Z" fill="#231915" />
    <circle cx="320" cy="108" r="14" fill="#231915" />
    <path d="M309 117 q11 6 22 0" fill="none" stroke="#e8b04a" stroke-width="4" stroke-linecap="round" />
    <!-- beard and moustache -->
    <path d="M285 176 C 288 196 296 222 314 232 C 332 224 342 200 345 176 C 336 188 326 192 314 192 C 302 192 292 188 285 176 Z" fill="#2c211c" />
    <path d="M297 236 q6 -8 3 -18 M314 236 q2 -8 0 -16 M330 230 q-2 -8 2 -14" fill="none" stroke="#6f625a" stroke-width="2" stroke-linecap="round" />
    <path d="M296 182 q9 -7 18 -2 q9 -5 18 2 q-9 5 -18 1 q-9 4 -18 -1 z" fill="#2c211c" />
    <!-- face -->
    <path d="M296 150 q6 -4 12 0 M320 150 q6 -4 12 0" fill="none" stroke="#231915" stroke-width="3" stroke-linecap="round" />
    <path d="M298 160 q4 3 8 0 M322 160 q4 3 8 0" fill="none" stroke="#231915" stroke-width="2.6" stroke-linecap="round" />
    <path d="M310 158 q-5 10 1 14" fill="none" stroke="#8a5530" stroke-width="2.4" stroke-linecap="round" />
    <path d="M314 132 v10" stroke="#e14a2c" stroke-width="4" stroke-linecap="round" />
    <!-- printed-dot texture -->
    <path d="M244 320 C 246 274 262 244 298 234 L 330 234 C 362 240 388 252 398 268 L 400 320 Z" fill="url(#dots)" />
    <ellipse cx="314" cy="168" rx="31" ry="38" fill="url(#dots)" />
  </g>
</svg>

<style>
  .ary {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
