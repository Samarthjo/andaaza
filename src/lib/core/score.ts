export type Side = 'high' | 'low' | 'exact';

/** A single miss is capped here so one wild guess cannot sink a whole day. */
export const FACTOR_CAP = 1000;

/** How many times off a guess is: 1 is perfect, 2 means half or double. */
export function factorOf(guess: number, answer: number): number {
  if (!(guess > 0) || !(answer > 0) || !Number.isFinite(guess)) return Infinity;
  return guess >= answer ? guess / answer : answer / guess;
}

export function sideOf(guess: number, answer: number): Side {
  if (guess > answer) return 'high';
  if (guess < answer) return 'low';
  return 'exact';
}

/** Geometric mean of capped factors. Empty input scores a perfect 1. */
export function dayScore(factors: number[]): number {
  if (!factors.length) return 1;
  const logSum = factors.reduce((acc, f) => {
    const capped = Number.isFinite(f) ? Math.min(FACTOR_CAP, Math.max(1, f)) : FACTOR_CAP;
    return acc + Math.log(capped);
  }, 0);
  return Math.exp(logSum / factors.length);
}

export interface Verdict {
  label: string;
  english: string;
  tone: 'bullseye' | 'great' | 'good' | 'meh' | 'far' | 'wild';
}

const VERDICTS: [number, Verdict][] = [
  [1.1, { label: 'Ekdum sahi!', english: 'Spot on', tone: 'bullseye' }],
  [1.5, { label: 'Bahut badhiya', english: 'Excellent', tone: 'great' }],
  [2, { label: 'Accha andaaza', english: 'Good guess', tone: 'good' }],
  [5, { label: 'Thoda door', english: 'A bit off', tone: 'meh' }],
  [10, { label: 'Kaafi door', english: 'Quite far', tone: 'far' }]
];
const WILD: Verdict = { label: 'Arre yaar!', english: 'Way off', tone: 'wild' };

export function verdictFor(factor: number): Verdict {
  for (const [limit, v] of VERDICTS) if (factor <= limit) return v;
  return WILD;
}

export function sideLabel(side: Side): { hi: string; en: string; arrow: string } {
  if (side === 'high') return { hi: 'Zyada', en: 'Too high', arrow: '↑' };
  if (side === 'low') return { hi: 'Kam', en: 'Too low', arrow: '↓' };
  return { hi: 'Bilkul', en: 'Exact', arrow: '=' };
}

/**
 * Crowd buckets on a log scale around the answer. Index 4 is the bullseye band.
 * Ratios are guess/answer.
 */
export const BUCKET_EDGES = [1 / 10, 1 / 4, 1 / 2, 1 / 1.25, 1.25, 2, 4, 10];
export const BUCKET_LABELS = ['<⅒', '⅒–¼', '¼–½', '½–0.8', '≈1×', '1.25–2×', '2–4×', '4–10×', '>10×'];
export const BUCKET_COUNT = BUCKET_EDGES.length + 1;
export const BULLSEYE_BUCKET = 4;

export function bucketOf(guess: number, answer: number): number {
  const ratio = guess / answer;
  let i = 0;
  while (i < BUCKET_EDGES.length && ratio >= BUCKET_EDGES[i]) i++;
  return i;
}

/** Distance of a bucket from the bullseye band, used for "closer than X%". */
export function bucketDistance(bucket: number): number {
  return Math.abs(bucket - BULLSEYE_BUCKET);
}

/**
 * Share of other players strictly further from the answer than this player,
 * using bucket distance. Ties count half. Returns null with no crowd data.
 */
export function closerThanPercent(counts: number[], myBucket: number): number | null {
  const total = counts.reduce((a, b) => a + b, 0);
  if (total < 1) return null;
  const mine = bucketDistance(myBucket);
  let further = 0;
  let same = 0;
  counts.forEach((c, i) => {
    const d = bucketDistance(i);
    if (d > mine) further += c;
    else if (d === mine) same += c;
  });
  return Math.round(((further + same / 2) / total) * 100);
}

export function emojiFor(factor: number): string {
  if (factor <= 1.25) return '🎯';
  if (factor <= 2) return '🟢';
  if (factor <= 4) return '🟡';
  if (factor <= 10) return '🟠';
  return '🔴';
}

/** Day score buckets for the results histogram (1×–1000× on a log axis). */
export const SCORE_EDGES = [1.25, 1.5, 2, 3, 5, 10, 30, 100, 1000];
export function scoreBucketOf(score: number): number {
  let i = 0;
  while (i < SCORE_EDGES.length && score > SCORE_EDGES[i]) i++;
  return Math.min(i, SCORE_EDGES.length - 1);
}
