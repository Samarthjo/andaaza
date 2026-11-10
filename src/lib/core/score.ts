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

/* ---------- Crowd histograms (21 log-scale bins, see supabase/migrations) ---------- */

export const BINS = 21;
/** Guess bins cover guess/answer from ÷10 (bin 0) to ×10 (bin 20); bin 10 holds the answer. */
export const ANSWER_BIN = 10;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Position of a guess on the ÷10…×10 axis, 0..1 (0.5 is the answer). */
export function guessPosition(guess: number, answer: number): number {
  if (!(guess > 0) || !(answer > 0)) return 0;
  return (clamp(Math.log10(guess / answer), -1, 1) + 1) / 2;
}

export function guessBin(guess: number, answer: number): number {
  return clamp(Math.floor(guessPosition(guess, answer) * BINS), 0, BINS - 1);
}

/** Day scores: 1× (bin 0) to 1000× (bin 20). */
export function scorePosition(score: number): number {
  return clamp(Math.log10(Math.max(1, score)) / 3, 0, 1);
}

export function scoreBin(score: number): number {
  return clamp(Math.floor(scorePosition(score) * BINS), 0, BINS - 1);
}

function withoutSelf(counts: number[], myBin: number, includesSelf: boolean): number[] {
  const c = counts.slice();
  if (includesSelf && c[myBin] > 0) c[myBin] -= 1;
  return c;
}

/**
 * Share of other players whose guess was further from the answer (by bin distance).
 * Ties count half. Null when nobody else has played.
 */
export function closerThanPercent(counts: number[], myBin: number, includesSelf = true): number | null {
  const c = withoutSelf(counts, myBin, includesSelf);
  const total = c.reduce((a, b) => a + b, 0);
  if (total < 1) return null;
  const mine = Math.abs(myBin - ANSWER_BIN);
  let further = 0;
  let same = 0;
  c.forEach((n, i) => {
    const d = Math.abs(i - ANSWER_BIN);
    if (d > mine) further += n;
    else if (d === mine) same += n;
  });
  return Math.round(((further + same / 2) / total) * 100);
}

/** "Top X%" for a day score among other players (lower score is better). Null without others. */
export function topPercent(counts: number[], myBin: number, includesSelf = true): number | null {
  const c = withoutSelf(counts, myBin, includesSelf);
  const total = c.reduce((a, b) => a + b, 0);
  if (total < 1) return null;
  let better = 0;
  for (let i = 0; i < myBin; i++) better += c[i];
  const pct = Math.ceil(((better + c[myBin] / 2 + 1) / (total + 1)) * 100);
  return clamp(pct, 1, 100);
}

/** "Top 12%" for the better half of players, "Bottom 8%" for the rest. Null when nobody else has played. */
export function rankLabel(counts: number[], myBin: number): string | null {
  const top = topPercent(counts, myBin);
  if (top === null) return null;
  if (top <= 50) return `Top ${top}%`;
  return `Bottom ${topPercent([...counts].reverse(), counts.length - 1 - myBin)}%`;
}

export function emojiFor(factor: number): string {
  if (factor <= 1.25) return '🎯';
  if (factor <= 2) return '🟢';
  if (factor <= 4) return '🟡';
  if (factor <= 10) return '🟠';
  return '🔴';
}
