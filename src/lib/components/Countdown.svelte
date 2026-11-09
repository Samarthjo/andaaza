<script lang="ts">
  import { onMount } from 'svelte';
  import { formatCountdown, msUntilNextPuzzle } from '$lib/core/date';

  let ms = $state(msUntilNextPuzzle());
  onMount(() => {
    const id = setInterval(() => (ms = msUntilNextPuzzle()), 1000);
    return () => clearInterval(id);
  });
</script>

<p class="countdown">
  Next puzzle in <time class="num" datetime="PT{Math.floor(ms / 1000)}S">{formatCountdown(ms)}</time>
</p>

<style>
  .countdown {
    color: var(--ink-soft);
  }
  time {
    font-family: var(--font-display);
    font-size: var(--t-lg);
    color: var(--ink);
    margin-left: 0.25rem;
  }
</style>
