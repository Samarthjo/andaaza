<script lang="ts">
  import Game from '$lib/game/Game.svelte';
</script>

<svelte:head>
  <title>Play Andaaza</title>
  <meta name="description" content="Three questions about India, one guess each. How close can you get?" />
</svelte:head>

<div class="game">
  <Game start="auto" />
</div>

<style>
  .game {
    padding-top: 0.5rem;
  }
</style>
