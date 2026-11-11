import { describe, expect, it } from 'vitest';
import { BINS } from './score';
import {
  BOARD_TARGET,
  CHART_TARGET,
  fillBoard,
  fillCounts,
  sampleBoard,
  sampleGuessCounts,
  sampleScoreCounts,
  scoreSpread,
  seeded
} from './samples';

const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

describe('sample crowd', () => {
  it('is the same for everyone on a given day', () => {
    expect(sampleGuessCounts('2026-11-11:0', 100)).toEqual(sampleGuessCounts('2026-11-11:0', 100));
    expect(sampleGuessCounts('2026-11-11:0', 100)).not.toEqual(sampleGuessCounts('2026-11-11:1', 100));
    expect(seeded('x')()).toBe(seeded('x')());
  });

  it('makes a full, spread-out chart around the answer', () => {
    const c = sampleGuessCounts('2026-11-11:2', 100);
    expect(c).toHaveLength(BINS);
    expect(sum(c)).toBe(100);
    expect(c.filter((n) => n > 0).length).toBeGreaterThan(8);
    expect(sum(sampleScoreCounts('2026-11-11', 100))).toBe(100);
  });

  it('only tops up: real data first, samples step aside as players arrive', () => {
    const real = new Array(BINS).fill(0);
    real[10] = 3;
    const filled = fillCounts(real, (n) => sampleGuessCounts('d', n));
    expect(sum(filled)).toBe(CHART_TARGET);
    expect(filled[10]).toBeGreaterThanOrEqual(3);
    const busy = new Array(BINS).fill(10);
    expect(fillCounts(busy, (n) => sampleGuessCounts('d', n))).toEqual(busy);
    expect(sum(fillCounts(null, (n) => sampleGuessCounts('d', n)))).toBe(CHART_TARGET);
  });
});

describe('sample leaderboard', () => {
  it('fills to 15 rows with real players ranked among them', () => {
    const real = [{ nickname: 'Asha', score: 1.2, games: 1 }];
    const rows = fillBoard(real, '2026-11-11', 'today');
    expect(rows).toHaveLength(BOARD_TARGET);
    expect(rows.some((r) => r.nickname === 'Asha' && !r.sample)).toBe(true);
    for (let i = 1; i < rows.length; i++) expect(rows[i].score).toBeGreaterThanOrEqual(rows[i - 1].score);
    expect(rows.every((r) => r.score >= 1 && r.nickname.length > 0)).toBe(true);
  });

  it('reshuffles every tab and the score chart each day, the same for everyone', () => {
    for (const range of ['today', 'week', 'all', 'streaks'] as const) {
      const day1 = fillBoard([], '2026-11-11', range);
      const day2 = fillBoard([], '2026-11-12', range);
      expect(fillBoard([], '2026-11-11', range)).toEqual(day1);
      expect(day2.map((r) => r.nickname)).not.toEqual(day1.map((r) => r.nickname));
      expect(day2.map((r) => r.score)).not.toEqual(day1.map((r) => r.score));
    }
    expect(sampleScoreCounts('2026-11-12', CHART_TARGET)).not.toEqual(sampleScoreCounts('2026-11-11', CHART_TARGET));
  });

  it('sorts streaks longest first and keeps every real row', () => {
    const real = Array.from({ length: 60 }, (_, i) => ({ nickname: `p${i}`, score: i + 1, games: 0 }));
    const rows = fillBoard(real, 'd', 'streaks');
    expect(rows).toHaveLength(60);
    expect(rows[0].score).toBe(60);
    expect(rows.every((r) => !r.sample)).toBe(true);
    expect(sampleBoard('d', 'streaks', 20).every((r) => r.score >= 1 && Number.isInteger(r.score))).toBe(true);
  });

  it('turns a score histogram into percentage buckets', () => {
    const counts = new Array(BINS).fill(0);
    counts[0] = 1; // about 1×
    counts[20] = 3; // 1000×
    expect(scoreSpread(counts)).toEqual([25, 0, 0, 0, 0, 0, 0, 75]);
    expect(Math.abs(sum(scoreSpread(sampleScoreCounts('d', 100))) - 100)).toBeLessThanOrEqual(4);
  });
});
