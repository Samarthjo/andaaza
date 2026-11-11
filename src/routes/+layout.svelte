<script lang="ts">
  import '../app.css';
  import { onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { base } from '$app/paths';
  import { page } from '$app/state';
  import Icon from '$lib/components/Icon.svelte';
  import MenuPanel from '$lib/components/MenuPanel.svelte';
  import ProfilePanel from '$lib/components/ProfilePanel.svelte';
  import SettingsDialog from '$lib/components/SettingsDialog.svelte';
  import { auth } from '$lib/state/auth.svelte';
  import { reportPending, setSignedIn } from '$lib/state/game';
  import { online } from '$lib/state/online';
  import { settings } from '$lib/state/settings.svelte';
  import { PREVIEW_IMAGE } from '$lib/site';

  let { children } = $props();
  let menuOpen = $state(false);
  let settingsOpen = $state(false);
  let youOpen = $state(false);

  onMount(() => {
    settings.load();
    auth.onChange((signedIn) => {
      settings.setUnlocked(signedIn);
      setSignedIn(signedIn);
    });
    auth.init();
    // Finished games that never reached the crowd charts (played offline or before online mode) get sent once.
    reportPending();
  });

  // The welcome note after logging in fades on its own.
  $effect(() => {
    if (!auth.notice) return;
    const t = setTimeout(() => (auth.notice = ''), 5000);
    return () => clearTimeout(t);
  });

  // Link previews (X, WhatsApp, LinkedIn) need an absolute image URL at build time.
  const previewImage = PREVIEW_IMAGE;

  const isHome = $derived(page.url.pathname === `${base}/` || page.url.pathname === base || page.url.pathname === '/');
</script>

<svelte:head>
  <meta property="og:site_name" content="Andaaza" />
  <meta property="og:type" content="website" />
  <meta property="og:image" content={previewImage} />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:image:alt" content="Andaaza: Ek padha-likha andaaza maaro. The daily estimation game for India." />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content={previewImage} />
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

{#if auth.notice}
  <div class="toast" role="status" transition:fly={{ y: 24, duration: 300 }}>{auth.notice}</div>
{/if}

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
  .toast {
    position: fixed;
    left: 50%;
    bottom: max(1.25rem, env(safe-area-inset-bottom));
    z-index: calc(var(--z-header) + 2);
    transform: translateX(-50%);
    width: max-content;
    max-width: calc(100vw - 2rem);
    padding: 0.85rem 1.4rem;
    border-radius: 999px;
    background: #1b1a2e;
    color: var(--haldi);
    font-weight: 700;
    box-shadow: 0 18px 40px -16px rgb(0 0 0 / 0.5);
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
