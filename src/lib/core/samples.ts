/**
 * Sample players for a new game: they fill the crowd charts and the leaderboard until real
 * players arrive, then step aside (samples = target − real). Everything is seeded by the
 * puzzle date, so everyone sees the same sample crowd on a given day.
 *
 * Percent claims ("closer than X% of players", "Top X%") never count samples.
 */
import { BINS } from './score';

/** Samples fill each guess and score chart up to this many entries. */
export const CHART_TARGET = 100;
/** Samples fill each leaderboard tab up to this many rows. */
export const BOARD_TARGET = 50;

/* ---------- seeded randomness ---------- */

function hash(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^ (h >>> 16)) >>> 0;
}

/** Deterministic random numbers in [0, 1) for a seed (mulberry32). */
export function seeded(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normal(r: () => number): number {
  let u = 0;
  while (u === 0) u = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const total = (c: number[] | null | undefined) => (c ?? []).reduce((a, b) => a + b, 0);

/* ---------- crowd charts ---------- */

/** Standard normal CDF (Abramowitz–Stegun 7.1.26). */
function phi(x: number): number {
  const t = 1 / (1 + 0.3275911 * (Math.abs(x) / Math.SQRT2));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(x * x) / 2);
  return x >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

/**
 * Spread `n` entries over 21 bins spanning [lo, hi] (log10 units) following a smooth crowd:
 * a main bell plus a smaller, wider shoulder that gives real crowds their lopsided tail.
 * Values past either end land in the end bins, as clamped guesses do.
 */
function crowd(n: number, lo: number, hi: number, mean: number, sd: number, tail: number): number[] {
  const width = (hi - lo) / BINS;
  const cdf = (x: number) => 0.75 * phi((x - mean) / sd) + 0.25 * phi((x - mean - tail) / (sd * 1.5));
  const p = Array.from({ length: BINS }, (_, i) => {
    const a = i === 0 ? -Infinity : lo + i * width;
    const b = i === BINS - 1 ? Infinity : lo + (i + 1) * width;
    return (b === Infinity ? 1 : cdf(b)) - (a === -Infinity ? 0 : cdf(a));
  });
  // Largest-remainder rounding so the bins add up to exactly n.
  const raw = p.map((x) => x * n);
  const counts = raw.map(Math.floor);
  let left = n - counts.reduce((a, b) => a + b, 0);
  raw
    .map((x, i) => [x - Math.floor(x), i] as const)
    .sort((a, b) => b[0] - a[0] || a[1] - b[1])
    .forEach(([, i]) => {
      if (left-- > 0) counts[i]++;
    });
  return counts;
}

/**
 * 21-bin guess histogram for `n` sample guesses on one question (÷10 to ×10 of the answer).
 * Each question gets its own crowd: a lean (most crowds guess a bit low or high) and a spread.
 */
export function sampleGuessCounts(seed: string, n: number): number[] {
  const r = seeded(`guess:${seed}`);
  const lean = (r() - 0.55) * 0.4;
  const spread = 0.24 + r() * 0.14;
  const tail = (r() < 0.5 ? -1 : 1) * (0.25 + r() * 0.2);
  return crowd(n, -1, 1, lean, spread, tail);
}

/** 21-bin day-score histogram (1× to 1,000×) for `n` sample players. A typical day lands at 5–10×. */
export function sampleScoreCounts(seed: string, n: number): number[] {
  const r = seeded(`score:${seed}`);
  return crowd(n, 0, 3, 0.72 + r() * 0.12, 0.2 + r() * 0.06, 0.45);
}

/** Real counts topped up with samples to CHART_TARGET entries. */
export function fillCounts(real: number[] | null, samples: (n: number) => number[]): number[] {
  const base = real && real.length === BINS ? real : new Array(BINS).fill(0);
  const extra = samples(Math.max(0, CHART_TARGET - total(base)));
  return base.map((v, i) => v + extra[i]);
}

/* ---------- leaderboard ---------- */

const FIRST = [
  'Aarav', 'Aditi', 'Aman', 'Ananya', 'Anjali', 'Arjun', 'Bhavna', 'Chirag', 'Deepak', 'Dev', 'Diya', 'Esha',
  'Farhan', 'Fatima', 'Gaurav', 'Gurpreet', 'Harini', 'Imran', 'Isha', 'Ishaan', 'Jaya', 'Jatin', 'Kabir',
  'Karthik', 'Kavya', 'Khushi', 'Lakshmi', 'Manish', 'Meera', 'Mohit', 'Nandini', 'Naveen', 'Neha', 'Nikhil',
  'Omkar', 'Pallavi', 'Parth', 'Pooja', 'Priya', 'Rahul', 'Rekha', 'Riya', 'Rohan', 'Saanvi', 'Sagar', 'Sameer',
  'Shreya', 'Sneha', 'Swati', 'Tanvi', 'Tara', 'Tejas', 'Tushar', 'Uday', 'Vaishnavi', 'Varun', 'Vihaan',
  'Vikram', 'Vivek', 'Yamini', 'Yash', 'Zoya'
];
const HANDLES = [
  'chai_and_maths', 'mumbai_local_fan', 'desi_estimator', 'lakh_crore_guy', 'jugaad_king', 'dosa_data',
  'biryani_bandit', 'cricket_crazy', 'pune_pundit', 'jaipur_jalebi', 'hyd_nawab', 'goa_vibes', 'indore_poha',
  'kolkata_rosogolla', 'delhi_dilwala', 'chennai_filter_coffee', 'bengaluru_traffic', 'lucknow_tehzeeb',
  'mota_hisab', 'tukka_master', 'anumaan_ji', 'guesstimate_wala', 'kochi_kappa', 'surat_diamond'
];

/** A random player name: a first name, a name with digits, or a handle. Repeats are fine. */
export function sampleName(r: () => number): string {
  const x = r();
  const first = FIRST[Math.floor(r() * FIRST.length)];
  if (x < 0.55) return first;
  if (x < 0.82) return `${first.toLowerCase()}_${10 + Math.floor(r() * 90)}`;
  return HANDLES[Math.floor(r() * HANDLES.length)];
}

export interface BoardEntry {
  nickname: string;
  score: number;
  games: number;
  sample?: boolean;
}
export type BoardRange = 'today' | 'week' | 'all' | 'streaks';

/** `n` sample rows for one leaderboard tab. For streaks, `score` holds the streak in days. */
export function sampleBoard(seed: string, range: BoardRange, n: number): BoardEntry[] {
  const r = seeded(`board:${range}:${seed}`);
  const rows: BoardEntry[] = [];
  for (let i = 0; i < n; i++) {
    const nickname = sampleName(r);
    if (range === 'streaks') {
      rows.push({ nickname, score: clamp(Math.round(Math.exp(1.1 + 0.75 * normal(r))), 1, 60), games: 0, sample: true });
      continue;
    }
    const [mean, sd, minGames, maxGames] =
      range === 'today' ? [0.82, 0.36, 1, 1] : range === 'week' ? [0.74, 0.22, 3, 7] : [0.78, 0.2, 3, 40];
    const log = clamp(mean + sd * normal(r), 0.015, 3);
    rows.push({
      nickname,
      score: Math.round(10 ** log * 100) / 100,
      games: minGames + Math.floor(r() * (maxGames - minGames + 1)),
      sample: true
    });
  }
  return rows;
}

/** Real rows topped up with samples to BOARD_TARGET, best first. */
export function fillBoard(real: BoardEntry[], seed: string, range: BoardRange): BoardEntry[] {
  const extra = sampleBoard(seed, range, Math.max(0, BOARD_TARGET - real.length));
  const rows = [...real, ...extra];
  rows.sort((a, b) => (range === 'streaks' ? b.score - a.score : a.score - b.score));
  return rows.slice(0, Math.max(BOARD_TARGET, real.length));
}

/* ---------- leaderboard score spread ---------- */

/** Fermi-style buckets for the "Today's scores" chart. */
export const SPREAD_LABELS = ['1×', '1.5×', '2×', '3×', '5×', '10×', '30×', '100×+'];
const SPREAD_EDGES = [1.22, 1.73, 2.45, 3.87, 7.07, 17.3, 54.8];

/** Re-bucket a 21-bin day-score histogram into the 8 spread buckets, as whole percentages. */
export function scoreSpread(counts: number[]): number[] {
  const buckets = new Array(SPREAD_LABELS.length).fill(0);
  counts.forEach((n, i) => {
    const centre = 10 ** (((i + 0.5) / BINS) * 3);
    const b = SPREAD_EDGES.findIndex((edge) => centre < edge);
    buckets[b === -1 ? buckets.length - 1 : b] += n;
  });
  const sum = total(buckets);
  return buckets.map((n) => (sum ? Math.round((n / sum) * 100) : 0));
}
