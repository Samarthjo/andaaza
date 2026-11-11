<!-- Title, description and the link-preview tags WhatsApp, X and LinkedIn read for one page. -->
<script lang="ts">
  import { page } from '$app/state';
  import { SITE_URL } from '$lib/site';

  let { title, description }: { title: string; description: string } = $props();
  // The route id is the path without the site's base folder, e.g. "/about".
  const url = $derived(SITE_URL + (page.route.id ?? '/'));
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
</svelte:head>
