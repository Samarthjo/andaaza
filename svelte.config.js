import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // On Vercel, adapter-static's zero-config mode writes Vercel's Build Output API
    // (clean URLs, immutable caching); it only kicks in when no options are passed.
    adapter: adapter(process.env.VERCEL ? undefined : { fallback: '404.html' }),
    // GitHub Pages project sites live under /<repo>; the deploy workflow sets BASE_PATH.
    paths: { base: process.env.BASE_PATH ?? '' },
    prerender: { entries: ['*'] },
    // A daily game lives in long-open tabs: notice new deploys so the next tap loads them
    // (see beforeNavigate in +layout.svelte) instead of running yesterday's code.
    version: { pollInterval: 5 * 60 * 1000 }
  }
};

export default config;
