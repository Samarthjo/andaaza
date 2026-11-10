<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { page } from '$app/state';
  import Icon from '$lib/components/Icon.svelte';
  import ProfilePanel from '$lib/components/ProfilePanel.svelte';
  import SettingsDialog from '$lib/components/SettingsDialog.svelte';
  import { online } from '$lib/state/online';
  import { settings } from '$lib/state/settings.svelte';

  let { children } = $props();
  let settingsOpen = $state(false);
  let youOpen = $state(false);

  onMount(() => settings.load());

  const current = (path: string) => (page.url.pathname === `${base}${path}` ? 'page' : undefined);
</script>

<svelte:head>
  <meta property="og:site_name" content="Andaaza" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary" />
</svelte:head>

<a class="skip" href="#main">Skip to content</a>

<header class="top">
  <div class="bar">
  <a class="mark" href="{base}/" aria-label="Andaaza home">
    <span class="word">Andaaza</span>
    <span class="deva" lang="hi" aria-hidden="true">अंदाज़ा</span>
  </a>
  <nav aria-label="Main">
    <a class="pill" href="{base}/archive" aria-current={current('/archive')}>
      <Icon name="calendar" size={18} /><span class="lbl">Archive</span>
    </a>
    <a class="pill" href="{base}/stats" aria-current={current('/stats')}>
      <Icon name="chart" size={18} /><span class="lbl">Stats</span>
    </a>
    <button class="icon-btn" onclick={() => (settingsOpen = true)} aria-label="Settings" title="Settings">
      <Icon name="settings" size={26} stroke={1.75} />
    </button>
    <button class="icon-btn" onclick={() => (youOpen = true)} aria-label="You" title="You">
      <Icon name="user" size={22} />
    </button>
  </nav>
  </div>
</header>

<main id="main">
  {@render children()}
</main>

<footer class="foot">
  <a href="{base}/about">About</a>
  <a href="{base}/submit">Suggest a question</a>
  {#if online}<a href="{base}/leaderboard">Leaderboard</a>{/if}
</footer>

<SettingsDialog bind:open={settingsOpen} />
<ProfilePanel bind:open={youOpen} />

<style>
  .skip {
    position: absolute;
    left: -999px;
    top: 0.5rem;
    background: var(--ink);
    color: var(--page);
    padding: 0.5rem 1rem;
    z-index: calc(var(--z-header) + 1);
  }
  .skip:focus {
    left: 0.5rem;
  }
  /* Floating, sticky: everything in the header stays on screen while you scroll. */
  .top {
    position: sticky;
    top: 0;
    z-index: var(--z-header);
    pointer-events: none;
    /* Soft fade so scrolled content never fights with the floating buttons. */
    background: linear-gradient(to bottom, var(--page) 0%, color-mix(in srgb, var(--page) 88%, transparent) 62%, transparent 100%);
  }
  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    max-width: 64rem;
    margin: 0 auto;
    padding: 0.75rem var(--gutter) 1.1rem;
  }
  .bar > * {
    pointer-events: auto;
  }
  .mark,
  .pill {
    display: inline-flex;
    align-items: center;
    height: 2.5rem;
    border-radius: 999px;
    background: var(--float);
    box-shadow: var(--shadow);
    text-decoration: none;
  }
  .mark {
    gap: 0.4rem;
    padding: 0 0.95rem;
    color: var(--binding);
  }
  .word {
    font-family: var(--font-display);
    font-size: 1.35rem;
    line-height: 1;
    padding-top: 0.15rem;
  }
  .deva {
    font-size: var(--t-xs);
    color: var(--ink-soft);
  }
  nav {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .pill {
    gap: 0.35rem;
    padding: 0 0.85rem;
    font-weight: 600;
    font-size: var(--t-sm);
    color: var(--ink);
    transition: transform 0.15s ease;
  }
  .pill:hover {
    transform: translateY(-1px);
  }
  .pill[aria-current='page'] {
    background: var(--ink);
    color: var(--page);
  }
  /* Narrow phones: icons only (names stay available to screen readers). */
  @media (max-width: 26rem) {
    .deva {
      display: none;
    }
    .pill {
      width: 2.5rem;
      padding: 0;
      justify-content: center;
    }
    .lbl {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
      white-space: nowrap;
    }
  }
  main {
    max-width: 64rem;
    margin: 0 auto;
    min-height: 70dvh;
  }
  .foot {
    max-width: 64rem;
    margin: 4rem auto 0;
    padding: 1.5rem var(--gutter) 2.5rem;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 1.25rem;
    color: var(--ink-soft);
    font-size: var(--t-sm);
  }
</style>
