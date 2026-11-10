// Checks the You panel when accounts are switched on (build with VITE_ACCOUNTS=1).
// Usage: node tests/e2e/accounts.mjs [baseUrl] [screenshotDir]
// Supabase is fully stubbed: no request reaches the real project.
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');

const base = process.argv[2] || 'http://127.0.0.1:4173';
const outDir = process.argv[3] || 'test-results/accounts';
mkdirSync(outDir, { recursive: true });
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined;

const fail = (msg) => {
  console.error('FAIL:', msg);
  process.exitCode = 1;
};

const browser = await chromium.launch({ proxy });
const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
const otp = [];
await context.route(/supabase\.co\//, async (route) => {
  const url = route.request().url();
  if (url.includes('/auth/v1/otp')) {
    otp.push(JSON.parse(route.request().postData() || '{}'));
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  }
  if (url.includes('/rest/v1/rpc/andaaza_puzzle_stats')) {
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ players: 0, buckets: [], scores: [] }) });
  }
  return route.fulfill({ status: 204, body: '' });
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

let n = 0;
const shot = async (name) => {
  n += 1;
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outDir, `${String(n).padStart(2, '0')}-${name}.png`) });
};

await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'You', exact: true }).click();
await page.waitForTimeout(500);
if (!(await page.getByRole('button', { name: 'Create account or log in' }).isVisible())) fail('no login button for guests');
if (!(await page.getByRole('button', { name: /Sign in to unlock/ }).isVisible())) fail('themes not shown as locked');
await shot('you-guest');

// A locked theme does not apply; it opens the login form instead.
await page.locator('.themes .theme', { hasText: 'Neel' }).click();
await page.waitForTimeout(400);
if ((await page.evaluate(() => document.documentElement.dataset.palette)) !== 'haldi') fail('locked theme applied for a guest');
if (!(await page.locator('#login-email').isVisible())) fail('login form did not open from a locked theme');
if (await page.getByRole('button', { name: 'Send link' }).isEnabled()) fail('send enabled with no email');
await page.locator('#login-email').fill('player@example.com');
await shot('you-login');
await page.getByRole('button', { name: 'Send link' }).click();
await page.getByText('Check your inbox').waitFor();
if (otp.length !== 1 || otp[0].email !== 'player@example.com') fail(`expected one sign-in email request, saw ${JSON.stringify(otp)}`);
await shot('you-sent');

// Leaderboard asks guests to log in instead of offering a name box.
await page.goto(base + '/leaderboard', { waitUntil: 'networkidle' });
if (await page.locator('#nick').count()) fail('guests should not get a leaderboard name box');
if (!(await page.getByText(/to put your name on the board/).isVisible())) fail('leaderboard login prompt missing');

if (errors.length) fail('browser errors:\n' + errors.join('\n'));
await browser.close();
console.log(process.exitCode ? 'ACCOUNTS E2E FAILED' : 'ACCOUNTS E2E PASSED');
