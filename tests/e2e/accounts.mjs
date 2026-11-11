// Accounts end to end against a production build (accounts on), with Supabase fully stubbed:
// guests are sent to log in for colour themes, the login page sends an email link with the
// player's name, coming back from that link signs them in, the theme they picked is applied
// and saved to their profile, the profile follows them to a fresh device, and logging out
// locks themes again.
// Usage: node tests/e2e/accounts.mjs [baseUrl] [screenshotDir]
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright');

const base = process.argv[2] || 'http://127.0.0.1:4173';
const outDir = process.argv[3] || 'test-results/accounts';
const scale = Number(process.env.SHOT_SCALE || 1);
mkdirSync(outDir, { recursive: true });
const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: '127.0.0.1,localhost' } : undefined;

const fail = (msg) => {
  console.error('FAIL:', msg);
  process.exitCode = 1;
};

// A signed-in player as Supabase would describe them, and an unsigned JWT-shaped token.
const USER = {
  id: '11111111-2222-4333-8444-555555555555',
  aud: 'authenticated',
  role: 'authenticated',
  email: 'player@example.com',
  user_metadata: { name: 'Asha' },
  app_metadata: { provider: 'email' },
  created_at: new Date().toISOString()
};
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
const now = Math.floor(Date.now() / 1000);
const token = `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: USER.id, email: USER.email, role: 'authenticated', aud: 'authenticated', iat: now, exp: now + 3600 })}.sig`;
const magicLink = `#access_token=${token}&expires_in=3600&expires_at=${now + 3600}&refresh_token=r1&token_type=bearer&type=magiclink`;

// What the trigger creates on sign-up: a profile holding the name only.
let profile = { name: 'Asha', palette: null, theme: null, number_style: null };
const otp = [];
const profileWrites = [];

const browser = await chromium.launch({ proxy });
const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: scale });
await context.route(/supabase\.co\//, async (route) => {
  const req = route.request();
  const url = req.url();
  const json = (status, body) => route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  if (url.includes('/auth/v1/settings')) return json(200, { external: { email: true, google: true } });
  if (url.includes('/auth/v1/otp')) {
    otp.push({ url, body: JSON.parse(req.postData() || '{}') });
    return json(200, {});
  }
  if (url.includes('/auth/v1/user')) return json(200, USER);
  if (url.includes('/auth/v1/logout')) return route.fulfill({ status: 204, body: '' });
  if (url.includes('/auth/v1/authorize')) return route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Google stub</p>' });
  if (url.includes('/rest/v1/andaaza_profiles')) {
    if (req.method() === 'GET') return json(200, [profile]);
    const body = JSON.parse(req.postData() || '{}');
    profileWrites.push(body);
    const { user_id: _, updated_at: __, ...fields } = body;
    profile = { ...profile, ...fields };
    return route.fulfill({ status: 201, body: '' });
  }
  if (url.includes('/rest/v1/andaaza_user_games')) return req.method() === 'GET' ? json(200, []) : route.fulfill({ status: 201, body: '' });
  if (url.includes('/rest/v1/rpc/andaaza_puzzle_stats')) return json(200, { players: 0, buckets: [], scores: [] });
  if (url.includes('/rest/v1/rpc/andaaza_leaderboard')) return json(200, []);
  if (url.includes('/rest/v1/rpc/')) return route.fulfill({ status: 204, body: '' });
  return json(404, {});
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
const palette = () => page.evaluate(() => document.documentElement.dataset.palette);
const openYou = async () => {
  await page.getByRole('button', { name: 'You', exact: true }).click();
  await page.waitForTimeout(500);
};

// 1. Guests: login button, locked themes, and a theme tap goes to the login page.
await page.goto(base + '/', { waitUntil: 'networkidle' });
await openYou();
if (!(await page.getByRole('link', { name: 'Create account or log in' }).isVisible())) fail('no login button for guests');
if (!(await page.getByRole('link', { name: /Log in to unlock/ }).isVisible())) fail('themes not shown as locked');
await page.locator('.themes .theme', { hasText: 'Neel' }).click();
await page.waitForURL(/\/login\?next=%2F$/);
await page.getByText('Log in to switch to Neel.').waitFor();
if ((await palette()) !== 'haldi') fail('locked theme applied for a guest');
if (!(await page.getByRole('button', { name: 'Continue with Google' }).isVisible())) fail('Google button missing although enabled');
await shot('login');

// 2. The form asks for a name and a valid email, then sends the link with the name attached.
await page.getByRole('button', { name: 'Continue with email' }).click();
if (!(await page.getByText('Add a name').isVisible())) fail('missing-name error not shown');
await page.locator('#login-name').fill('Asha');
await page.locator('#login-email').fill('not-an-email');
await page.getByRole('button', { name: 'Continue with email' }).click();
if (!(await page.getByText('doesn’t look right').isVisible())) fail('bad-email error not shown');
if (otp.length) fail('sent a login email for invalid input');
await page.locator('#login-email').fill('player@example.com');
await page.getByRole('button', { name: 'Continue with email' }).click();
await page.getByText('Check your inbox').waitFor();
const sent = otp[0];
if (!sent || sent.body.email !== 'player@example.com' || sent.body.data?.name !== 'Asha') fail(`login email request wrong: ${JSON.stringify(sent)}`);
if (sent && new URL(sent.url).searchParams.get('redirect_to') !== new URL(base).origin + '/') fail(`login link returns to ${sent?.url}`);
await shot('login-sent');

// 3. Opening the link signs in: welcome note, the theme picked earlier is on and saved.
await page.goto(base + '/' + magicLink, { waitUntil: 'networkidle' });
await page.getByText('Welcome, Asha! Colour themes are unlocked.').waitFor();
if ((await palette()) !== 'neel') fail(`theme picked before logging in not applied: ${await palette()}`);
const first = profileWrites[0];
if (!first || first.palette !== 'neel' || first.user_id !== USER.id) fail(`profile not saved after login: ${JSON.stringify(first)}`);
if (page.url().includes('access_token')) fail('token left in the address bar');
await shot('welcome');

// 4. Signed in: name in the panel, themes unlocked, choices saved to the profile.
await openYou();
if (!(await page.locator('#you-title').innerText()).includes('Asha')) fail('panel does not greet the player by name');
if (await page.getByRole('link', { name: /Log in to unlock/ }).count()) fail('themes still locked after login');
await page.locator('.themes .theme', { hasText: 'Mehendi' }).click();
await page.waitForTimeout(700);
if ((await palette()) !== 'mehendi') fail('theme change did not apply when signed in');
if (profileWrites.at(-1)?.palette !== 'mehendi') fail('theme change not saved to the profile');
await page.locator('#nick').fill('Asha R');
await page.getByRole('button', { name: 'Save' }).click();
await page.waitForTimeout(700);
if (profileWrites.at(-1)?.name !== 'Asha R') fail('leaderboard name not saved to the profile');
await shot('you-signed-in');
await page.getByRole('button', { name: 'Close', exact: true }).click();
await page.waitForTimeout(400);

// 5. A fresh device (no local settings) gets the saved theme from the profile.
await page.evaluate(() => localStorage.removeItem('andaaza:v1:settings'));
await page.goto(base + '/', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
if ((await palette()) !== 'mehendi') fail(`profile theme not restored on a fresh device: ${await palette()}`);

// 6. Logging out locks themes again.
await openYou();
await page.getByRole('button', { name: 'Log out' }).click();
await page.waitForTimeout(500);
if ((await palette()) !== 'haldi') fail('themes still unlocked after logging out');
if (!(await page.getByRole('link', { name: 'Create account or log in' }).isVisible())) fail('login button missing after logging out');
await page.getByRole('button', { name: 'Close', exact: true }).click();
await page.waitForTimeout(400);

// 7. Guests see a login link on the leaderboard; Google hands off to Supabase.
await page.goto(base + '/leaderboard', { waitUntil: 'networkidle' });
if (await page.locator('#nick').count()) fail('guests should not get a leaderboard name box');
if (!(await page.getByRole('link', { name: 'Log in' }).first().isVisible())) fail('leaderboard login link missing');
await page.goto(base + '/login', { waitUntil: 'networkidle' });
await page.getByRole('button', { name: 'Continue with Google' }).click();
await page.waitForURL(/\/auth\/v1\/authorize\?provider=google/);

if (errors.length) fail('browser errors:\n' + errors.join('\n'));
await browser.close();
console.log(process.exitCode ? 'ACCOUNTS E2E FAILED' : 'ACCOUNTS E2E PASSED');
