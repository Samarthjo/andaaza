import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ fallback: '404.html' }),
    // GitHub Pages project sites live under /<repo>; the deploy workflow sets BASE_PATH.
    paths: { base: process.env.BASE_PATH ?? '' },
    prerender: { entries: ['*'] }
  }
};

export default config;
