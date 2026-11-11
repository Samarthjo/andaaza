import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

declare const process: { env: Record<string, string | undefined> };

// On Vercel, share text and social previews point at the production domain.
if (!process.env.VITE_SITE_URL && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
  process.env.VITE_SITE_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
}

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node'
  }
});
