<script lang="ts">
  import Meta from '$lib/components/Meta.svelte';
  import Game from '$lib/game/Game.svelte';
</script>

<Meta title="Play today’s Andaaza" description="Three questions about India, one guess each. How close can you get?" />

<div class="game">
  <Game start="auto" />
</div>

<style>
  .game {
    padding-top: 0.5rem;
  }
</style>
