// End-to-end play-through against a running build (npm run build && npm run preview).
// Usage: node tests/e2e/playthrough.mjs [baseUrl] [screenshotDir]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

// Uses whichever Playwright is installed (project or global) via CommonJS resolution.
const { chromium } = createRequire(import.meta.url)('playwright');

const base = process.argv[2] || 'http://127.0.0.1:4173';
const outDir = process.argv[3] || 'test-results/e2e';
const scale = Number(process.env.SHOT_SCALE || 1);
mkdirSync(outDir, { recursive: true });

const proxy = process.env.HTTPS_PROXY
  ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' }
  : undefined;

const fail = (msg) => {
  console.error('FAIL:', msg);
  process.exitCode = 1;
};

const browser = await chromium.launch({ proxy });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: scale });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(`console: ${m.text()}`);
});

let n = 0;
const shot = async (name, full = false) => {
  n += 1;
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, `${String(n).padStart(2, '0')}-${name}.png`), fullPage: full });
};

// Landing
await page.goto(base + '/', { waitUntil: 'networkidle' });
await shot('home');
await shot('home-full', true);
await page.getByRole('link', { name: /^Play No\. \d+/ }).click();
await page.waitForURL(/\/play/);

// Q1: type with lakh/crore words
const input = () => page.locator('input[id^="guess-"]');
await input().fill('40 lakh');
const preview = await page.locator('.preview').innerText();
if (!/40,00,000/.test(preview)) fail(`preview did not show Indian grouping: ${preview}`);
await shot('q1-typed');
await page.getByRole('button', { name: 'Lock my guess' }).click();
await page.locator('.reveal').waitFor();
await page.waitForTimeout(1100); // ruler animation
await shot('q1-reveal');
await page.locator('summary', { hasText: 'See the hisaab' }).click();
await shot('q1-hisaab', true);
await page.getByRole('button', { name: /On to question 2/ }).click();

// Q2: use the calculator
await page.getByRole('button', { name: /Open calculator/ }).click();
await page.locator('#calc-expr').fill('2 lakh × 6');
const calcRes = await page.locator('.result').innerText();
if (!/12,00,000/.test(calcRes)) fail(`calculator result wrong: ${calcRes}`);
await shot('calculator');
await page.getByRole('button', { name: 'Use as my guess' }).click();
const v = await input().inputValue();
if (v !== '1200000') fail(`calculator did not fill guess: ${v}`);
await page.getByRole('button', { name: 'Lock my guess' }).click();
await page.locator('.reveal').waitFor();
await page.getByRole('button', { name: /On to question 3/ }).click();

// Q3: invalid then valid input
await input().fill('lots');
await input().blur();
const err = await page.locator('.preview .err').count();
if (!err) fail('no validation message for invalid guess');
if (await page.getByRole('button', { name: 'Lock my guess' }).isEnabled()) fail('lock enabled for invalid guess');
await input().fill('75');
await input().press('Enter');
await page.locator('.reveal').waitFor();
await page.getByRole('button', { name: 'See my total' }).click();
await page.locator('.results').waitFor();
await shot('results');
await shot('results-full', true);

// Persistence: reload lands on results
await page.reload({ waitUntil: 'networkidle' });
if (!(await page.locator('.results').count())) fail('results not restored after reload');

// Copy text
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(base).origin });
await page.getByRole('button', { name: 'Copy result text' }).click();
const clip = await page.evaluate(() => navigator.clipboard.readText());
if (!/^Andaaza No\. \d+/.test(clip) || clip.split('\n').length < 5) fail(`bad share text: ${clip}`);
console.log('share text:\n' + clip);

// Archive + replay an old puzzle
await page.goto(base + '/archive', { waitUntil: 'networkidle' });
await shot('archive');
const rows = await page.locator('.list li').count();
if (rows < 2) fail(`archive rows: ${rows}`);
await page.locator('.list li').last().locator('a').click();
await page.waitForURL(/\/play\?d=/);
if (!(await page.getByText('Archive', { exact: true }).count())) fail('archive tag missing on old puzzle');

// Future date is refused
await page.goto(base + '/play?d=2099-01-01', { waitUntil: 'networkidle' });
if (!(await page.locator('.notice').count())) fail('future date not refused');

// Stats
await page.goto(base + '/stats', { waitUntil: 'networkidle' });
await shot('stats');
const played = await page.locator('.tiles dd').first().innerText();
if (played.trim() !== '1') fail(`stats played = ${played}`);

// Settings: dark + Neel + international numbers
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Settings' }).click();
await page.getByRole('button', { name: /Neel/ }).click();
await page.getByRole('button', { name: 'Dark' }).click();
await page.getByRole('button', { name: 'Million and billion' }).click();
await shot('settings');
await page.getByRole('button', { name: 'Close settings' }).click();
const attrs = await page.evaluate(() => [document.documentElement.dataset.palette, document.documentElement.dataset.theme]);
if (attrs.join() !== 'neel,dark') fail(`theme attrs ${attrs}`);
await page.goto(base + '/play', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: /Q1/ }).click();
await page.waitForTimeout(1100);
await shot('dark-neel-reveal');

// Mehendi light
await page.evaluate(() =>
  localStorage.setItem('andaaza:v1:settings', JSON.stringify({ palette: 'mehendi', theme: 'light', numberStyle: 'indian' }))
);
await page.goto(base + '/play?d=2026-11-02', { waitUntil: 'networkidle' });
await shot('mehendi-question');

// Desktop width
await page.setViewportSize({ width: 1280, height: 900 });
await page.goto(base + '/', { waitUntil: 'networkidle' });
await shot('desktop-home');

// No horizontal overflow at 320px
await page.setViewportSize({ width: 320, height: 700 });
for (const p of ['/', '/play', '/archive', '/stats', '/about', '/submit']) {
  await page.goto(base + p, { waitUntil: 'networkidle' });
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (over > 0) fail(`horizontal overflow ${over}px on ${p} at 320px`);
}

if (errors.length) fail('browser errors:\n' + errors.join('\n'));
await browser.close();
console.log(process.exitCode ? 'E2E FAILED' : 'E2E PASSED');
