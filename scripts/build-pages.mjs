// Builds the site for GitHub Pages and writes it to the repository root, which Pages
// serves straight from the main branch (Settings → Pages → Deploy from a branch →
// main → / (root)). The files written are listed in .pages-files, so the next run can
// clear them without touching the source tree.
// Usage: npm run build:pages
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const repo = process.env.PAGES_REPO || 'andaaza';
const owner = process.env.PAGES_OWNER || 'samarthjo';
const MANIFEST = '.pages-files';

execSync('npx vite build', {
  stdio: 'inherit',
  env: {
    ...process.env,
    BASE_PATH: `/${repo}`,
    VITE_SITE_URL: process.env.VITE_SITE_URL || `https://${owner}.github.io/${repo}`
  }
});
if (!existsSync('build/index.html')) throw new Error('build/index.html missing; build failed');

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [path.relative('build', p).split(path.sep).join('/')];
  });
const files = walk('build').sort();
const previous = existsSync(MANIFEST) ? readFileSync(MANIFEST, 'utf8').split('\n').filter(Boolean) : [];

// Never overwrite a file this script did not write (source code, README, ...).
const owned = new Set(previous);
const clash = files.filter((f) => existsSync(f) && !owned.has(f));
if (clash.length) throw new Error(`Refusing to overwrite files the Pages build does not own: ${clash.join(', ')}`);

// Clear the last build, including folders it leaves empty (old hashed chunks under _app/).
for (const f of previous) rmSync(f, { force: true });
const dirs = [...new Set(previous.map((f) => path.dirname(f)).filter((d) => d !== '.'))];
for (const d of dirs.sort((a, b) => b.length - a.length)) {
  for (let cur = d; cur !== '.'; cur = path.dirname(cur)) {
    if (existsSync(cur) && readdirSync(cur).length === 0) rmdirSync(cur);
  }
}

for (const f of files) {
  mkdirSync(path.dirname(f), { recursive: true });
  copyFileSync(path.join('build', f), f);
}
// Serve files as-is (Jekyll would hide the _app folder and render the README instead).
writeFileSync('.nojekyll', '');
writeFileSync(MANIFEST, files.join('\n') + '\n');
// The site used to live in docs/.
rmSync('docs', { recursive: true, force: true });
console.log(`\nWrote ${files.length} Pages files to the repo root for https://${owner}.github.io/${repo}/`);
