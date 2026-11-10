<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { base } from '$app/paths';
  import { page } from '$app/state';
  import Icon from '$lib/components/Icon.svelte';
  import MenuPanel from '$lib/components/MenuPanel.svelte';
  import ProfilePanel from '$lib/components/ProfilePanel.svelte';
  import SettingsDialog from '$lib/components/SettingsDialog.svelte';
  import { online } from '$lib/state/online';
  import { settings } from '$lib/state/settings.svelte';

  let { children } = $props();
  let menuOpen = $state(false);
  let settingsOpen = $state(false);
  let youOpen = $state(false);

  onMount(() => settings.load());

  const isHome = $derived(page.url.pathname === `${base}/` || page.url.pathname === base || page.url.pathname === '/');
</script>

<svelte:head>
  <meta property="og:site_name" content="Andaaza" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary" />
</svelte:head>

<a class="skip" href="#main">Skip to content</a>

<header class="corners">
  <div class="side">
    <button class="icon-btn menu" onclick={() => (menuOpen = true)} aria-label="Open menu" title="Menu">
      <Icon name="menu" size={20} stroke={2.2} />
    </button>
    {#if !isHome}
      <a class="icon-btn" href="{base}/" aria-label="Back to today’s puzzle" title="Today’s puzzle">
        <Icon name="chevron-left" size={22} />
      </a>
    {/if}
  </div>
  <div class="side">
    <button class="icon-btn" onclick={() => (settingsOpen = true)} aria-label="Settings" title="Settings">
      <Icon name="settings" size={26} stroke={1.75} />
    </button>
    <button class="icon-btn" onclick={() => (youOpen = true)} aria-label="You" title="You">
      <Icon name="user" size={22} />
    </button>
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

<MenuPanel bind:open={menuOpen} />
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
    left: 4rem;
  }
  /* Corner buttons stay on screen while you scroll: menu far left, settings and you far right. */
  .corners {
    position: fixed;
    inset: 0 0 auto 0;
    z-index: var(--z-header);
    display: flex;
    justify-content: space-between;
    padding: 0.9rem 0.9rem 0;
    pointer-events: none;
  }
  .side {
    display: flex;
    gap: 0.55rem;
    pointer-events: auto;
  }
  .menu {
    background: var(--card-q1);
    color: #fff;
  }
  main {
    max-width: 72rem;
    margin: 0 auto;
    padding: 4.4rem var(--gutter) 0;
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
