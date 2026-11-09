import { addDays, daysBetween } from './date';
import { dayScore, factorOf, sideOf } from './score';

export interface GameRecord {
  dateKey: string;
  mode: 'daily' | 'archive';
  guesses: number[];
  answers: number[];
  completed: boolean;
}

export interface PlayerStats {
  played: number;
  dailyPlayed: number;
  currentStreak: number;
  maxStreak: number;
  bestScore: number | null;
  averageScore: number | null;
  /** Share of guesses that were too high, 0..1. */
  highShare: number | null;
  /** Geometric-mean lean: >1 means you guess high on average. */
  lean: number | null;
  recent: { dateKey: string; score: number }[];
}

/**
 * Streak counts consecutive days with a completed *daily* game, ending today,
 * or ending yesterday if today is not played yet.
 */
export function computeStats(records: GameRecord[], today: string): PlayerStats {
  const done = records.filter((r) => r.completed && r.guesses.length === r.answers.length && r.answers.length > 0);
  const scores = done.map((r) => ({
    dateKey: r.dateKey,
    score: dayScore(r.guesses.map((g, i) => factorOf(g, r.answers[i])))
  }));

  const dailyDays = new Set(done.filter((r) => r.mode === 'daily').map((r) => r.dateKey));

  let currentStreak = 0;
  let cursor = dailyDays.has(today) ? today : addDays(today, -1);
  while (dailyDays.has(cursor)) {
    currentStreak++;
    cursor = addDays(cursor, -1);
  }

  const sortedDaily = [...dailyDays].sort();
  let maxStreak = 0;
  let run = 0;
  sortedDaily.forEach((k, i) => {
    run = i > 0 && daysBetween(sortedDaily[i - 1], k) === 1 ? run + 1 : 1;
    maxStreak = Math.max(maxStreak, run);
  });

  let highs = 0;
  let total = 0;
  let logLean = 0;
  for (const r of done) {
    r.guesses.forEach((g, i) => {
      const a = r.answers[i];
      if (!(g > 0) || !(a > 0)) return;
      total++;
      if (sideOf(g, a) === 'high') highs++;
      // clamp each lean to ±3 orders of magnitude to keep one wild guess from dominating
      logLean += Math.max(-3, Math.min(3, Math.log10(g / a)));
    });
  }

  return {
    played: done.length,
    dailyPlayed: dailyDays.size,
    currentStreak,
    maxStreak,
    bestScore: scores.length ? Math.min(...scores.map((s) => s.score)) : null,
    averageScore: scores.length ? Math.exp(scores.reduce((a, s) => a + Math.log(s.score), 0) / scores.length) : null,
    highShare: total ? highs / total : null,
    lean: total ? Math.pow(10, logLean / total) : null,
    recent: scores.sort((a, b) => (a.dateKey < b.dateKey ? -1 : 1)).slice(-30)
  };
}
