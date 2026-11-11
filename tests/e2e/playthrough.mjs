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
// Anything else on Supabase (auth settings, profiles, synced games) never reaches the real project either.
await context.route(/supabase\.co\//, (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }));
await context.route('**/rest/v1/rpc/**', async (route) => {
  const fn = route.request().url().split('/rpc/')[1];
  if (fn.startsWith('andaaza_puzzle_stats')) {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ players: 120, buckets: [bell, bell, bell], scores }) });
  }
  if (fn.startsWith('andaaza_streaks')) {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ nickname: 'test-player', streak: 4 }]) });
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
await page.evaluate(() => document.fonts.ready);
await shot('intro');
if (!(await playBtn().count())) fail('intro card has no play button');
// "padha-likha" hangs under the caret: centred on it unless it would spill out of the headline.
const caretFit = await page.evaluate(() => {
  const c = document.querySelector('.intro .caret').getBoundingClientRect();
  const t = document.querySelector('.intro .insert').getBoundingClientRect();
  const h = document.querySelector('.intro .headline').getBoundingClientRect();
  return {
    off: Math.abs(c.left + c.width / 2 - (t.left + t.width / 2)),
    below: t.top - c.bottom,
    inside: t.left >= h.left - 1 && t.right <= h.right + 1,
    atEdge: Math.abs(t.left - h.left) < 1.5 || Math.abs(t.right - h.right) < 1.5
  };
});
if (!caretFit.inside) fail('padha-likha spills out of the headline');
if (caretFit.off > 2 && !caretFit.atEdge) fail(`padha-likha not under the caret (${caretFit.off}px off)`);
if (caretFit.below < -4) fail(`padha-likha overlaps the caret (${caretFit.below}px)`);
if (!(await page.locator('#how-title').count())) fail('how to play missing on intro');
await page.evaluate(() => window.scrollTo(0, document.getElementById('how-title').getBoundingClientRect().top + window.scrollY - 90));
await page.waitForTimeout(1600);
await shot('how-to-play');
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
await page.getByRole('button', { name: /Mota hisab/ }).click();
await page.waitForTimeout(500);
if (!(await page.getByText('One way to estimate it').isVisible())) fail('napkin panel did not open');
await shot('napkin');
await page.getByRole('button', { name: /Mota hisab/ }).click();
await page.locator('button.next').click();

// Q2: calculator
await input().waitFor();
await page.waitForTimeout(500);
await page.getByRole('button', { name: 'Open calculator' }).click();
await page.waitForTimeout(400);
// A physical keyboard works straight away; Enter evaluates.
await page.keyboard.type('12*3');
await page.keyboard.press('Enter');
if ((await page.locator('#calc-expr').inputValue()) !== '36') fail('typing does not reach the calculator');
await page.getByRole('button', { name: 'Clear', exact: true }).click();
for (const k of ['2', 'lakh', 'Times', '6']) await page.getByRole('button', { name: k, exact: true }).click();
const calcRes = await page.locator('.result').innerText();
if (!/12,00,000/.test(calcRes)) fail(`calculator result wrong: ${calcRes}`);
if ((await page.locator('#calc-expr').inputValue()) !== '2 lakh × 6') fail('keypad did not build the expression');
if (!/Q2/.test(await page.locator('.scratch .qn').innerText())) fail('scratch pad not labelled for Q2');
await page.locator('#calc-notes').fill('6 lakh villages × 2 booths');
await sheetFits('calculator');
const calcBox = await page.locator('dialog[open]').boundingBox();
if (!calcBox || calcBox.y < 0 || Math.abs(calcBox.y + calcBox.height - 844) > 1) fail(`calculator sheet not pinned to the bottom: ${JSON.stringify(calcBox)}`);
await page.locator('#calc-expr').focus();
await page.evaluate(() => document.querySelector('dialog[open] .body').scrollTo(0, 0));
await page.mouse.move(0, 0);
await shot('calculator');
await page.getByRole('button', { name: 'Use as my guess' }).click();
await page.waitForTimeout(400);
const v = await input().inputValue();
if (v !== '1200000') fail(`calculator did not fill guess: ${v}`);
await page.getByRole('button', { name: /Lock it in/ }).click();
await page.locator('.reveal').waitFor();
await page.waitForTimeout(600);
// From the reveal the calculator is for checking sums: notes kept, no "use" button.
await page.getByRole('button', { name: 'Open calculator' }).click();
await page.waitForTimeout(400);
if ((await page.locator('#calc-notes').inputValue()) !== '6 lakh villages × 2 booths') fail('scratch pad lost its note');
if (await page.getByRole('button', { name: /Use as my guess/ }).count()) fail('use button shown outside the guess step');
await page.getByRole('button', { name: 'Close calculator' }).click();
await page.waitForTimeout(400);
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
if (!/(top|bottom) \d+%/i.test(await page.locator('.results .top .tag').innerText())) fail('rank tag missing');
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
if (!(await page.getByText('Day streak').isVisible())) fail('profile panel missing streak');
if ((await page.locator('.themes .theme').count()) !== 4) fail('profile panel should offer 4 themes');
if (!(await page.getByRole('link', { name: 'Create account or log in' }).isVisible())) fail('guests get no login button');
await sheetFits('profile');
// Side panels are full-height drawers from the right (bottom sheets failed on iPhone Safari).
const you = await page.locator('dialog[open]').boundingBox();
if (!you || you.y > 1 || you.height < 840 || Math.abs(you.x + you.width - 390) > 1) fail(`You panel is not a right-hand drawer: ${JSON.stringify(you)}`);
await shot('profile');
// Guests who pick a colour theme are asked to log in first; the page stays on Haldi.
await page.locator('.themes .theme', { hasText: 'Neel' }).click();
await page.waitForURL(/\/login\?next=/);
await page.getByText('Log in to switch to Neel.').waitFor();
if ((await page.evaluate(() => document.documentElement.dataset.palette)) !== 'haldi') fail('a locked theme applied for a guest');
// Google only shows once it's switched on in Supabase (the stub says it isn't).
if (await page.getByRole('button', { name: 'Continue with Google' }).count()) fail('Google button shown while Google login is off');
await page.waitForTimeout(500);
await shot('login');

// Leaderboard: tabs, guest banner, today's score spread, 50 rows (real players among sample ones)
await page.goto(base + '/leaderboard', { waitUntil: 'networkidle' });
await page.locator('.table li').first().waitFor();
if ((await page.getByRole('tab').count()) !== 4) fail('leaderboard should have 4 tabs');
if (!/Log in to join the leaderboard/.test(await page.locator('.banner').innerText())) fail('guest banner missing');
if ((await page.locator('.spread .bar').count()) !== 8) fail('today’s score spread should have 8 bars');
if ((await page.locator('.table li').count()) !== 50) fail(`leaderboard should list 50 rows, saw ${await page.locator('.table li').count()}`);
if (!(await page.locator('.table li', { hasText: 'test-player' }).count())) fail('real player missing from the board');
if (!(await page.getByText('Sample players fill the board').isVisible())) fail('sample note missing');
await page.waitForTimeout(600);
await shot('leaderboard');
await page.getByRole('tab', { name: 'Streaks' }).click();
await page.locator('.table li', { hasText: 'test-player' }).waitFor();
if (!(await page.locator('.head').innerText()).toLowerCase().includes('days')) fail('streaks tab should count days');

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

// Settings: dark mode works for everyone
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Settings' }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Dark' }).click();
await sheetFits('settings');
await shot('settings');
await page.getByRole('button', { name: 'Close settings' }).click();
await page.waitForTimeout(400);
const attrs = await page.evaluate(() => [document.documentElement.dataset.palette, document.documentElement.dataset.theme]);
if (attrs.join() !== 'haldi,dark') fail(`theme attrs ${attrs}`);
await shot('intro-dark');

// Desktop
await page.setViewportSize({ width: 1280, height: 900 });
await page.evaluate(() => localStorage.setItem('andaaza:v1:settings', JSON.stringify({ palette: 'haldi', theme: 'light', numberStyle: 'indian' })));
await page.goto(base + '/', { waitUntil: 'networkidle' });
await shot('desktop-intro');
await page.evaluate(() => window.scrollTo(0, document.getElementById('how-title').getBoundingClientRect().top + window.scrollY - 90));
await page.waitForTimeout(1600);
await shot('desktop-how');
await page.evaluate(() => window.scrollTo(0, 0));
const dg = await page.getByRole('button', { name: 'You', exact: true }).boundingBox();
if (!dg || dg.x < 1280 - 80) fail(`profile button not at far right on desktop: x=${dg?.x}`);
await page.goto(base + '/play', { waitUntil: 'networkidle' });
await page.locator('.results').waitFor();
await page.waitForTimeout(1400);
const cols = await page.evaluate(() => {
  const a = document.querySelector('.results .split .top').getBoundingClientRect();
  const b = document.querySelector('.results .split .dist').getBoundingClientRect();
  return { sideBySide: b.left >= a.right, sameRow: Math.abs(a.top - b.top) < 4 };
});
if (!cols.sideBySide || !cols.sameRow) fail(`desktop results should put score and bars side by side: ${JSON.stringify(cols)}`);
await shot('desktop-results');
await page.goto(base + '/play?d=2026-11-02', { waitUntil: 'networkidle' });
await input().waitFor();
await page.getByRole('button', { name: 'Open calculator' }).click();
await page.waitForTimeout(400);
await page.keyboard.type('140 crore * 30% / 4');
await page.locator('#calc-notes').fill('140 crore people\nabout 30% are kids\n÷ 4 per family');
await page.locator('#calc-expr').focus();
await shot('desktop-calculator');
await page.getByRole('button', { name: 'Close calculator' }).click();
await page.waitForTimeout(400);
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

// A finished game that never reached the server is sent once on the next visit.
const sent = writes.filter((w) => w.startsWith('andaaza_record_game')).length;
await page.evaluate(() => {
  for (const k of Object.keys(localStorage)) {
    if (!k.startsWith('andaaza:v1:game:')) continue;
    const g = JSON.parse(localStorage.getItem(k));
    if (g.completed) localStorage.setItem(k, JSON.stringify({ ...g, reported: false }));
  }
});
await page.goto(base + '/stats', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
if (writes.filter((w) => w.startsWith('andaaza_record_game')).length !== sent + 1) fail('unreported game was not backfilled');
const flagged = await page.evaluate(() =>
  Object.keys(localStorage)
    .filter((k) => k.startsWith('andaaza:v1:game:'))
    .map((k) => JSON.parse(localStorage.getItem(k)))
    .filter((g) => g.completed)
    .every((g) => g.reported === true)
);
if (!flagged) fail('backfilled game not marked as reported');

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
