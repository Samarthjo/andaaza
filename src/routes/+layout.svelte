<script lang="ts">
  import { base } from '$app/paths';
  import '../app.css';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import SettingsDialog from '$lib/components/SettingsDialog.svelte';
  import { online } from '$lib/state/online';
  import { settings } from '$lib/state/settings.svelte';

  let { children } = $props();
  let settingsOpen = $state(false);

  onMount(() => settings.load());

  const nav = [
    { href: `${base}/archive`, label: 'Archive' },
    { href: `${base}/stats`, label: 'Stats' }
  ];
</script>

<svelte:head>
  <meta property="og:site_name" content="Andaaza" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary" />
</svelte:head>

<a class="skip" href="#main">Skip to content</a>

<header class="top">
  <a class="mark" href="{base}/" aria-label="Andaaza home">
    <span class="word">Andaaza</span>
    <span class="deva" lang="hi">अंदाज़ा</span>
  </a>
  <nav aria-label="Main">
    {#each nav as item (item.href)}
      <a href={item.href} aria-current={page.url.pathname === item.href ? 'page' : undefined}>{item.label}</a>
    {/each}
    <button class="gear" onclick={() => (settingsOpen = true)} aria-label="Settings">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8.4-2.6.1-.9-.1-.9 2-1.6-2-3.4-2.4.9a7.7 7.7 0 0 0-1.6-.9L16 3.5h-4l-.4 2.6c-.6.2-1.1.5-1.6.9l-2.4-.9-2 3.4 2 1.6-.1.9.1.9-2 1.6 2 3.4 2.4-.9c.5.4 1 .7 1.6.9l.4 2.6h4l.4-2.6c.6-.2 1.1-.5 1.6-.9l2.4.9 2-3.4-2-1.6Z"
        />
      </svg>
    </button>
  </nav>
</header>

<main id="main">
  {@render children()}
</main>

<footer class="foot">
  <nav aria-label="More">
    <a href="{base}/about">About</a>
    <a href="{base}/submit">Suggest a question</a>
    {#if online}<a href="{base}/leaderboard">Leaderboard</a>{/if}
  </nav>
  <p>A new puzzle every midnight, India time.</p>
</footer>

<SettingsDialog bind:open={settingsOpen} />

<style>
  .skip {
    position: absolute;
    left: -999px;
    top: 0.5rem;
    background: var(--ink);
    color: var(--page);
    padding: 0.5rem 1rem;
    z-index: 10;
  }
  .skip:focus {
    left: 0.5rem;
  }
  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    padding: 0.75rem var(--gutter);
    max-width: 48rem;
    margin: 0 auto;
  }
  .mark {
    display: flex;
    align-items: baseline;
    gap: 0.45rem;
    text-decoration: none;
    color: var(--binding);
  }
  .word {
    font-family: var(--font-display);
    font-size: 1.6rem;
    line-height: 1;
  }
  .deva {
    font-size: var(--t-sm);
    color: var(--ink-soft);
  }
  @media (max-width: 22rem) {
    .deva {
      display: none;
    }
  }
  nav {
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  nav a {
    padding: 0.4rem 0.55rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    font-size: var(--t-sm);
  }
  nav a[aria-current='page'] {
    text-decoration: underline;
    text-decoration-color: var(--margin);
  }
  .gear {
    display: grid;
    place-items: center;
    width: 2.5rem;
    height: 2.5rem;
    border: none;
    border-radius: 999px;
    background: transparent;
    color: var(--ink-soft);
    cursor: pointer;
  }
  .gear:hover {
    background: var(--page-2);
  }
  main {
    max-width: 48rem;
    margin: 0 auto;
    min-height: 70dvh;
  }
  .foot {
    max-width: 48rem;
    margin: 3rem auto 0;
    padding: 1.5rem var(--gutter) 2.5rem;
    border-top: 1px solid var(--rule);
    color: var(--ink-soft);
    font-size: var(--t-sm);
    display: grid;
    gap: 0.5rem;
  }
  .foot nav {
    gap: 1rem;
    flex-wrap: wrap;
  }
  .foot nav a {
    padding: 0;
  }
</style>
