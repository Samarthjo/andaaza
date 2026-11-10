// End-to-end play-through against a running build (npm run build && npm run preview).
// Usage: node tests/e2e/playthrough.mjs [baseUrl] [screenshotDir]
// Supabase calls are intercepted and answered with canned data, so tests never write
// to the real crowd database.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

// Uses whichever Playwright is installed (project or global) via CommonJS resolution.
const { chromium } = createRequire(import.meta.url)('playwright');

const base = process.argv[2] || 'http://127.0.0.1:4173';
const outDir = process.argv[3] || 'test-results/e2e';
const scale = Number(process.env.SHOT_SCALE || 1);
mkdirSync(outDir, { recursive: true });

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined;

const fail = (msg) => {
  console.error('FAIL:', msg);
  process.exitCode = 1;
};

// A bell-ish crowd around the answer for every question, plus a spread of day scores.
const bell = Array.from({ length: 21 }, (_, i) => Math.round(40 * Math.exp(-((i - 10) ** 2) / 18)) + 1);
const scores = Array.from({ length: 21 }, (_, i) => Math.round(30 * Math.exp(-((i - 4) ** 2) / 10)));
const writes = [];

const browser = await chromium.launch({ proxy });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: scale });
await context.route('**/rest/v1/rpc/**', async (route) => {
  const fn = route.request().url().split('/rpc/')[1];
  if (fn.startsWith('andaaza_puzzle_stats')) {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ players: 120, buckets: [bell, bell, bell], scores }) });
  }
  if (fn.startsWith('andaaza_leaderboard')) {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ nickname: 'test-player', score: 1.31, games: 1 }]) });
  }
  writes.push(fn);
  return route.fulfill({ status: 204, body: '' });
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(`console: ${m.text()}`);
});

let n = 0;
const shot = async (name, full = false) => {
  n += 1;
  await page.waitForTimeout(450);
  await page.screenshot({ path: path.join(outDir, `${String(n).padStart(2, '0')}-${name}.png`), fullPage: full });
};
const input = () => page.locator('input[id^="guess-"]');
const sheetFits = async (name) => {
  const m = await page.evaluate(() => {
    const b = document.querySelector('dialog[open] .body');
    return b ? b.scrollWidth - b.clientWidth : 0;
  });
  if (m > 0) fail(`${name} sheet overflows sideways by ${m}px`);
};
const playBtn = () => page.locator('.gcard').getByRole('button', { name: /Play today’s|Continue|View results/ });

// Landing: intro card first, landing sections below
await page.goto(base + '/', { waitUntil: 'networkidle' });
await shot('intro');
if (!(await playBtn().count())) fail('intro card has no play button');
if (!(await page.locator('#how-title').count())) fail('how to play missing on intro');
await page.locator('#what-title').scrollIntoViewIfNeeded();
await page.waitForTimeout(500);
await shot('what-is');
const gear = await page.getByRole('button', { name: 'Settings' }).boundingBox();
const menu = await page.getByRole('button', { name: 'Open menu' }).boundingBox();
if (!gear || gear.y < 0 || gear.y > 60) fail(`header not fixed, gear at y=${gear?.y}`);
if (!menu || menu.x > 40) fail(`menu button not at far left: x=${menu?.x}`);
if (gear && gear.x < 390 - 120) fail(`gear not at far right: x=${gear.x}`);
await page.getByText('When does the new puzzle come out?').click();
if (!(await page.getByText('Every night at 12:00 midnight India time.').isVisible())) fail('FAQ answer did not open');
await shot('faq');

// Play: intro card turns into Q1, landing sections go away
await page.evaluate(() => window.scrollTo(0, 0));
await playBtn().click();
await input().waitFor();
await page.waitForTimeout(700);
if (await page.locator('#how-title').count()) fail('landing sections still shown while playing');
await input().fill('40 lakh');
const help = await page.locator('p[id^="help-"]').innerText();
if (!/40,00,000/.test(help)) fail(`helper did not show Indian grouping: ${help}`);
await shot('q1-typed');
await page.getByRole('button', { name: /Lock it in/ }).click();
await page.locator('.reveal').waitFor();
await page.waitForTimeout(1400);
if ((await page.locator('.chart .bar').count()) !== 21) fail('crowd chart does not have 21 bars');
if (!/closer than \d+% of players/.test(await page.locator('.landed').innerText())) fail('closer-than line missing');
await shot('q1-reveal');
await shot('q1-reveal-full', true);
await page.getByRole('button', { name: /Napkin math/ }).click();
await page.waitForTimeout(500);
if (!(await page.getByText('One way to estimate it').isVisible())) fail('napkin panel did not open');
await shot('napkin');
await page.getByRole('button', { name: /Napkin math/ }).click();
await page.locator('button.next').click();

// Q2: calculator
await input().waitFor();
await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Open calculator' }).click();
await page.locator('#calc-expr').fill('2 lakh × 6');
const calcRes = await page.locator('.result').innerText();
if (!/12,00,000/.test(calcRes)) fail(`calculator result wrong: ${calcRes}`);
await sheetFits('calculator');
await shot('calculator');
await page.getByRole('button', { name: 'Use as my guess' }).click();
await page.waitForTimeout(400);
const v = await input().inputValue();
if (v !== '1200000') fail(`calculator did not fill guess: ${v}`);
await page.getByRole('button', { name: /Lock it in/ }).click();
await page.locator('.reveal').waitFor();
await page.waitForTimeout(600);
await page.locator('button.next').click();

// Q3: invalid then valid
await input().waitFor();
await page.waitForTimeout(500);
await input().fill('lots');
await input().blur();
if (!(await page.locator('p[id^="help-"] .err').count())) fail('no validation message for invalid guess');
if (await page.getByRole('button', { name: /Lock it in/ }).isEnabled()) fail('lock enabled for invalid guess');
await input().fill('75');
await input().press('Enter');
await page.locator('.reveal').waitFor();
await page.waitForTimeout(600);
await page.locator('button.next', { hasText: 'See results' }).click();
await page.locator('.results').waitFor();
await page.waitForTimeout(1300);
if (!/top \d+%/i.test(await page.locator('.results .top .tag').innerText())) fail('Top % tag missing');
await shot('results');
await shot('results-full', true);
const wrote = writes.filter((w) => w.startsWith('andaaza_record_answer')).length;
if (wrote !== 3) fail(`expected 3 answer writes, saw ${wrote}`);
if (!writes.some((w) => w.startsWith('andaaza_record_game'))) fail('finished game not recorded');

// Copy text
await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(base).origin });
await page.getByRole('button', { name: 'Copy text' }).click();
const clip = await page.evaluate(() => navigator.clipboard.readText());
if (!/^Andaaza No\. \d+/.test(clip) || clip.split('\n').length < 5) fail(`bad share text: ${clip}`);
console.log('share text:\n' + clip);

// Reload: intro offers results
await page.goto(base + '/', { waitUntil: 'networkidle' });
if (!(await page.locator('.gcard').getByRole('button', { name: /View results/ }).count())) fail('intro did not offer View results');

// Menu panel
await page.getByRole('button', { name: 'Open menu' }).click();
await page.waitForTimeout(600);
if (!/1 of \d+ played/.test(await page.locator('.progress').innerText())) fail('menu archive progress wrong');
if ((await page.locator('.cell.done').count()) !== 1) fail('menu grid should show one finished day');
await sheetFits('menu');
await shot('menu');
await page.getByRole('button', { name: 'Close menu' }).click();
await page.waitForTimeout(400);

// Profile panel
await page.getByRole('button', { name: 'You', exact: true }).click();
await page.waitForTimeout(500);
if (!(await page.getByText('day streak').isVisible())) fail('profile panel missing streak');
await sheetFits('profile');
await shot('profile');
await page.getByRole('button', { name: 'Close', exact: true }).click();
await page.waitForTimeout(400);

// Archive + replay an old puzzle
await page.goto(base + '/archive', { waitUntil: 'networkidle' });
await shot('archive');
await page.locator('.list li').last().locator('a').click();
await page.waitForURL(/\/play\?d=/);
await input().waitFor();
// Future date is refused
await page.goto(base + '/play?d=2099-01-01', { waitUntil: 'networkidle' });
if (!(await page.locator('.notice').count())) fail('future date not refused');

// Stats page still reachable
await page.goto(base + '/stats', { waitUntil: 'networkidle' });
const played = await page.locator('.tiles div', { hasText: 'Finished' }).locator('dd').innerText();
if (played.trim() !== '1') fail(`stats finished = ${played}`);

// Settings: dark + Neel
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Settings' }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: /Neel/ }).click();
await page.getByRole('button', { name: 'Dark' }).click();
await sheetFits('settings');
await shot('settings');
await page.getByRole('button', { name: 'Close settings' }).click();
await page.waitForTimeout(400);
const attrs = await page.evaluate(() => [document.documentElement.dataset.palette, document.documentElement.dataset.theme]);
if (attrs.join() !== 'neel,dark') fail(`theme attrs ${attrs}`);
await shot('intro-dark');

// Desktop
await page.setViewportSize({ width: 1280, height: 900 });
await page.evaluate(() => localStorage.setItem('andaaza:v1:settings', JSON.stringify({ palette: 'haldi', theme: 'light', numberStyle: 'indian' })));
await page.goto(base + '/', { waitUntil: 'networkidle' });
await shot('desktop-intro');
const dg = await page.getByRole('button', { name: 'You', exact: true }).boundingBox();
if (!dg || dg.x < 1280 - 80) fail(`profile button not at far right on desktop: x=${dg?.x}`);
await page.goto(base + '/play?d=2026-11-02', { waitUntil: 'networkidle' });
await input().fill('90');
await page.getByRole('button', { name: /Lock it in/ }).click();
await page.locator('.reveal').waitFor();
await page.waitForTimeout(1500);
await shot('desktop-reveal');
await page.locator('#what-title').count();
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.locator('#what-title').scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await shot('desktop-what');

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
