/** First puzzle date (No. 1). */
export const LAUNCH_DATE = '2026-11-01';
export const TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET_MIN = 330; // India has no DST.

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isDateKey(s: unknown): s is string {
  if (typeof s !== 'string') return false;
  const m = DATE_RE.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.toISOString().slice(0, 10) === s;
}

/** Calendar date in India for a given instant, as YYYY-MM-DD. */
export function istDateKey(now: Date = new Date()): string {
  const shifted = new Date(now.getTime() + IST_OFFSET_MIN * 60_000);
  return shifted.toISOString().slice(0, 10);
}

function toUtcDay(key: string): number {
  const [y, m, d] = key.split('-').map(Number);
  return Date.UTC(y, m - 1, d) / 86_400_000;
}

export function daysBetween(fromKey: string, toKey: string): number {
  return Math.round(toUtcDay(toKey) - toUtcDay(fromKey));
}

export function addDays(key: string, days: number): string {
  const t = (toUtcDay(key) + days) * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** Puzzle number for a date; 1 on launch day, < 1 before launch. */
export function puzzleNumber(key: string): number {
  return daysBetween(LAUNCH_DATE, key) + 1;
}

export function dateForPuzzle(n: number): string {
  return addDays(LAUNCH_DATE, n - 1);
}

/** Milliseconds until the next 00:00 IST. */
export function msUntilNextPuzzle(now: Date = new Date()): number {
  const today = istDateKey(now);
  const nextMidnightUtc = (toUtcDay(addDays(today, 1)) * 86_400_000) - IST_OFFSET_MIN * 60_000;
  return Math.max(0, nextMidnightUtc - now.getTime());
}

export function formatCountdown(ms: number): string {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':');
}

const longFmt = new Intl.DateTimeFormat('en-IN', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC'
});
const shortFmt = new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const weekdayFmt = new Intl.DateTimeFormat('en-IN', { weekday: 'short', timeZone: 'UTC' });

function keyToDate(key: string): Date {
  return new Date(toUtcDay(key) * 86_400_000);
}

export const formatLongDate = (key: string) => longFmt.format(keyToDate(key));
export const formatShortDate = (key: string) => shortFmt.format(keyToDate(key));
export const formatWeekday = (key: string) => weekdayFmt.format(keyToDate(key));

/** All playable dates from launch through `today`, newest first. */
export function playableDates(today: string): string[] {
  const out: string[] = [];
  for (let k = today; daysBetween(LAUNCH_DATE, k) >= 0; k = addDays(k, -1)) out.push(k);
  return out;
}
