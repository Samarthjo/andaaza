import { describe, expect, it } from 'vitest';
import { evaluate, tryEvaluate } from './calc';
import {
  addDays,
  daysBetween,
  formatCountdown,
  isDateKey,
  istDateKey,
  msUntilNextPuzzle,
  playableDates,
  puzzleNumber
} from './date';
import { formatCompact, formatFactor, formatGrouped, formatWords, parseGuess } from './number';
import {
  ANSWER_BIN,
  BINS,
  closerThanPercent,
  guessBin,
  guessPosition,
  scoreBin,
  topPercent,
  dayScore,
  emojiFor,
  factorOf,
  sideOf,
  verdictFor
} from './score';
import { computeStats, type GameRecord } from './stats';

describe('parseGuess', () => {
  const cases: [string, number | null][] = [
    ['7000', 7000],
    ['12,34,567', 1234567],
    ['1,234,567', 1234567],
    ['40 lakh', 4e6],
    ['40L', 4e6],
    ['40 lakhs', 4e6],
    ['2.5 cr', 2.5e7],
    ['1.2 crore', 1.2e7],
    ['₹615 crore', 6.15e9],
    ['3k', 3000],
    ['5 million', 5e6],
    ['1.2B', 1.2e9],
    ['5e6', 5e6],
    ['1.5 lakh crore', 1.5e17 / 1e5],
    ['.5', 0.5],
    ['  42  ', 42],
    ['0', null],
    ['-5', null],
    ['abc', null],
    ['5 bananas', null],
    ['', null],
    ['1e400', null]
  ];
  it.each(cases)('%s → %s', (input, expected) => {
    const got = parseGuess(input);
    if (expected === null) expect(got).toBeNull();
    else expect(got).toBeCloseTo(expected, 6);
  });
});

describe('formatting', () => {
  it('groups Indian style', () => {
    expect(formatGrouped(1234567)).toBe('12,34,567');
    expect(formatGrouped(1234567, 'international')).toBe('1,234,567');
  });
  it('words', () => {
    expect(formatWords(25_000_000)).toBe('2.5 crore');
    expect(formatWords(640_867)).toBe('6.41 lakh');
    expect(formatWords(968_000_000)).toBe('96.8 crore');
    expect(formatWords(1.2e13)).toBe('12 lakh crore');
    expect(formatWords(25_000_000, 'international')).toBe('25 million');
    expect(formatWords(4500)).toBe('4.5 thousand');
    expect(formatWords(52)).toBe('52');
  });
  it('compact', () => {
    expect(formatCompact(25_000_000)).toBe('2.5Cr');
    expect(formatCompact(4_000_000)).toBe('40L');
    expect(formatCompact(1_200_000_000, 'international')).toBe('1.2B');
    expect(formatCompact(7)).toBe('7');
  });
  it('factor display tiers', () => {
    expect(formatFactor(1.234)).toBe('1.23×');
    expect(formatFactor(72.16)).toBe('72.2×');
    expect(formatFactor(1452.57)).toBe('1,453×');
    expect(formatFactor(22_233_333)).toBe('2.2Cr×');
    expect(formatFactor(478_022)).toBe('4.8L×');
  });
});

describe('scoring', () => {
  it('factor is symmetric and ≥ 1', () => {
    expect(factorOf(200, 100)).toBe(2);
    expect(factorOf(50, 100)).toBe(2);
    expect(factorOf(100, 100)).toBe(1);
    expect(factorOf(0, 100)).toBe(Infinity);
  });
  it('side', () => {
    expect(sideOf(2, 1)).toBe('high');
    expect(sideOf(1, 2)).toBe('low');
    expect(sideOf(1, 1)).toBe('exact');
  });
  it('day score is a capped geometric mean', () => {
    expect(dayScore([2, 2, 2])).toBeCloseTo(2, 10);
    expect(dayScore([1, 4, 16])).toBeCloseTo(4, 10);
    // 1453 is capped to 1000: cbrt(1000 × 72.165 × 1.6333) ≈ 49.0
    expect(dayScore([1452.57, 72.165, 1.6333])).toBeCloseTo(49.0, 1);
    expect(dayScore([Infinity, 1, 1])).toBeCloseTo(10, 10);
    expect(dayScore([])).toBe(1);
  });
  it('verdict tiers', () => {
    expect(verdictFor(1.05).label).toBe('Ekdum sahi!');
    expect(verdictFor(1.4).tone).toBe('great');
    expect(verdictFor(2).tone).toBe('good');
    expect(verdictFor(4.9).tone).toBe('meh');
    expect(verdictFor(9).tone).toBe('far');
    expect(verdictFor(11).tone).toBe('wild');
  });
  it('buckets', () => {
    expect(BINS).toBe(21);
    expect(guessBin(100, 100)).toBe(ANSWER_BIN);
    expect(guessBin(105, 100)).toBe(ANSWER_BIN);
    expect(guessBin(1, 100)).toBe(0);
    expect(guessBin(10, 100)).toBe(0);
    expect(guessBin(1000, 100)).toBe(BINS - 1);
    expect(guessBin(10_000, 100)).toBe(BINS - 1);
    expect(guessBin(200, 100)).toBe(13);
    expect(guessPosition(100, 100)).toBeCloseTo(0.5, 10);
    expect(scoreBin(1)).toBe(0);
    expect(scoreBin(3.2)).toBe(3);
    expect(scoreBin(391)).toBe(18);
    expect(scoreBin(5000)).toBe(BINS - 1);
  });
  it('closer-than percentile', () => {
    const counts = Array(BINS).fill(0);
    counts[0] = 50; // far low
    counts[ANSWER_BIN] = 50; // on the answer
    expect(closerThanPercent(counts, ANSWER_BIN, false)).toBe(75);
    expect(closerThanPercent(counts, 0, false)).toBe(25);
    // Own guess is already counted: excluding it leaves nobody else.
    const solo = Array(BINS).fill(0);
    solo[ANSWER_BIN] = 1;
    expect(closerThanPercent(solo, ANSWER_BIN)).toBeNull();
    expect(closerThanPercent(Array(BINS).fill(0), ANSWER_BIN)).toBeNull();
  });
  it('top percent for day scores', () => {
    const counts = Array(BINS).fill(0);
    counts[2] = 9; // nine others did better
    counts[10] = 1; // me
    expect(topPercent(counts, 10)).toBe(100);
    expect(topPercent(counts, 1, false)).toBe(10);
    const solo = Array(BINS).fill(0);
    solo[5] = 1;
    expect(topPercent(solo, 5)).toBeNull();
  });
  it('emoji', () => {
    expect(emojiFor(1.1)).toBe('🎯');
    expect(emojiFor(1.9)).toBe('🟢');
    expect(emojiFor(3)).toBe('🟡');
    expect(emojiFor(8)).toBe('🟠');
    expect(emojiFor(80)).toBe('🔴');
  });
});

describe('dates (IST)', () => {
  it('rolls over at IST midnight, not UTC', () => {
    expect(istDateKey(new Date('2026-11-09T18:29:59Z'))).toBe('2026-11-09');
    expect(istDateKey(new Date('2026-11-09T18:30:00Z'))).toBe('2026-11-10');
  });
  it('arithmetic', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(daysBetween('2026-11-01', '2026-11-09')).toBe(8);
    expect(puzzleNumber('2026-11-01')).toBe(1);
    expect(puzzleNumber('2026-11-09')).toBe(9);
    expect(puzzleNumber('2026-10-31')).toBe(0);
  });
  it('validates keys', () => {
    expect(isDateKey('2026-02-29')).toBe(false);
    expect(isDateKey('2028-02-29')).toBe(true);
    expect(isDateKey('2026-1-1')).toBe(false);
    expect(isDateKey(undefined)).toBe(false);
  });
  it('countdown to next IST midnight', () => {
    expect(msUntilNextPuzzle(new Date('2026-11-09T18:00:00Z'))).toBe(30 * 60 * 1000);
    expect(formatCountdown(3_723_000)).toBe('01:02:03');
  });
  it('playable dates newest first', () => {
    const d = playableDates('2026-11-03');
    expect(d).toEqual(['2026-11-03', '2026-11-02', '2026-11-01']);
  });
});

describe('calculator', () => {
  it.each([
    ['2+3*4', 14],
    ['(2+3)*4', 20],
    ['2^10', 1024],
    ['-2^2', -4],
    ['10 lakh / 4', 250_000],
    ['1.5 cr × 2', 3e7],
    ['144 crore * 0.45 * 365 / 1000', 2.3652e8],
    ['50%', 0.5],
    ['200 * 10%', 20],
    ['2(3+4)', 14],
    ['1,00,000 + 5', 100_005],
    ['5e3 + 1', 5001],
    ['3k ÷ 3', 1000]
  ])('%s = %s', (src, expected) => {
    expect(evaluate(src)).toBeCloseTo(expected as number, 6);
  });
  it('rejects bad input', () => {
    expect(tryEvaluate('2+')).toBeNull();
    expect(tryEvaluate('1/0')).toBeNull();
    expect(tryEvaluate('alert(1)')).toBeNull();
    expect(tryEvaluate('lakh')).toBeNull();
    expect(tryEvaluate('(2')).toBeNull();
    expect(tryEvaluate('')).toBeNull();
  });
});

describe('stats', () => {
  const rec = (dateKey: string, guesses: number[], mode: 'daily' | 'archive' = 'daily'): GameRecord => ({
    dateKey,
    mode,
    guesses,
    answers: [100, 100, 100],
    completed: true
  });
  it('streaks and scores', () => {
    const s = computeStats(
      [
        rec('2026-11-05', [100, 100, 100]),
        rec('2026-11-07', [200, 200, 200]),
        rec('2026-11-08', [50, 50, 50]),
        rec('2026-11-09', [400, 400, 400]),
        rec('2026-11-01', [100, 100, 100], 'archive')
      ],
      '2026-11-09'
    );
    expect(s.played).toBe(5);
    expect(s.dailyPlayed).toBe(4);
    expect(s.currentStreak).toBe(3);
    expect(s.maxStreak).toBe(3);
    expect(s.bestScore).toBeCloseTo(1, 10);
    expect(s.highShare).toBeCloseTo(6 / 15, 10);
  });
  it('streak survives until today is played', () => {
    const s = computeStats([rec('2026-11-08', [100, 100, 100])], '2026-11-09');
    expect(s.currentStreak).toBe(1);
  });
  it('empty', () => {
    const s = computeStats([], '2026-11-09');
    expect(s.played).toBe(0);
    expect(s.bestScore).toBeNull();
  });
});
