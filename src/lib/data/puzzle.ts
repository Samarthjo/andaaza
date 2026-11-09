import { dateForPuzzle, puzzleNumber } from '$lib/core/date';
import { QUESTIONS, QUESTION_BY_ID } from './questions';
import { SCHEDULE } from './schedule';
import type { Question } from './types';

export const QUESTIONS_PER_DAY = 3;

export interface Puzzle {
  dateKey: string;
  number: number;
  questions: Question[];
  /** True when the day is past the curated schedule and reuses earlier questions. */
  rerun: boolean;
}

/** Deterministic PRNG (mulberry32) so every player gets the same rerun line-up. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled<T>(items: T[], seed: number): T[] {
  const rand = mulberry32(seed);
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function rerunIds(n: number): string[] {
  const offset = n - SCHEDULE.length - 1; // 0-based day after the schedule ends
  const perCycle = Math.floor(QUESTIONS.length / QUESTIONS_PER_DAY);
  const cycle = Math.floor(offset / perCycle);
  const slot = offset % perCycle;
  const order = shuffled(
    QUESTIONS.map((q) => q.id),
    0x5eed + cycle * 7919
  );
  return order.slice(slot * QUESTIONS_PER_DAY, slot * QUESTIONS_PER_DAY + QUESTIONS_PER_DAY);
}

export function puzzleFor(dateKey: string): Puzzle | null {
  const n = puzzleNumber(dateKey);
  if (n < 1) return null;
  const rerun = n > SCHEDULE.length;
  const ids = rerun ? rerunIds(n) : SCHEDULE[n - 1];
  const questions = ids.map((id) => {
    const q = QUESTION_BY_ID.get(id);
    if (!q) throw new Error(`Unknown question id ${id}`);
    return q;
  });
  return { dateKey, number: n, questions, rerun };
}

export function puzzleByNumber(n: number): Puzzle | null {
  return puzzleFor(dateForPuzzle(n));
}
