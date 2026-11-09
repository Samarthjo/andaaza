// Builds the site for GitHub Pages and writes it to docs/, which Pages serves
// from the main branch (Settings → Pages → Deploy from a branch → main → /docs).
// Usage: npm run build:pages
import { execSync } from 'node:child_process';
import { cpSync, existsSync, rmSync, writeFileSync } from 'node:fs';

const repo = process.env.PAGES_REPO || 'andaaza';
const owner = process.env.PAGES_OWNER || 'samarthjo';

execSync('npx vite build', {
  stdio: 'inherit',
  env: {
    ...process.env,
    BASE_PATH: `/${repo}`,
    VITE_SITE_URL: process.env.VITE_SITE_URL || `https://${owner}.github.io/${repo}`
  }
});

if (!existsSync('build/index.html')) throw new Error('build/index.html missing; build failed');
rmSync('docs', { recursive: true, force: true });
cpSync('build', 'docs', { recursive: true });
// Serve files as-is (Jekyll would hide the _app folder).
writeFileSync('docs/.nojekyll', '');
console.log(`\nWrote Pages site to docs/ for https://${owner}.github.io/${repo}/`);
