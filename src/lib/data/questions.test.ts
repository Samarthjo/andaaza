import { describe, expect, it } from 'vitest';
import { addDays, LAUNCH_DATE } from '$lib/core/date';
import { factorOf } from '$lib/core/score';
import { puzzleFor } from './puzzle';
import { QUESTIONS } from './questions';
import { SCHEDULE } from './schedule';

describe('question bank', () => {
  it('has unique ids', () => {
    const ids = QUESTIONS.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(QUESTIONS.map((q) => [q.id, q] as const))('%s is well formed', (_id, q) => {
    expect(q.prompt.trim().length).toBeGreaterThan(15);
    expect(q.prompt.trim().endsWith('?')).toBe(true);
    expect(Number.isFinite(q.answer) && q.answer > 0).toBe(true);
    expect(q.unit.label.length > 0 || !!q.unit.prefix).toBe(true);
    expect(q.source.length).toBeGreaterThan(3);
    expect(q.napkin.steps.length).toBeGreaterThanOrEqual(2);
    // Napkin math should land in the right ballpark (within 1.5×) or it teaches the wrong habit.
    expect(factorOf(q.napkin.estimate, q.answer)).toBeLessThan(1.5);
  });
});

describe('schedule', () => {
  it('uses every question exactly once', () => {
    const used = SCHEDULE.flat();
    expect(new Set(used).size).toBe(used.length);
    expect(new Set(used)).toEqual(new Set(QUESTIONS.map((q) => q.id)));
  });

  it('starts at No. 1 on launch day and refuses earlier dates', () => {
    expect(puzzleFor(LAUNCH_DATE)?.number).toBe(1);
    expect(puzzleFor(addDays(LAUNCH_DATE, -1))).toBeNull();
  });

  it('reruns are deterministic, have 3 distinct questions, and do not repeat within a cycle', () => {
    const cycle = Math.floor(QUESTIONS.length / 3);
    const seen = new Set<string>();
    for (let d = SCHEDULE.length; d < SCHEDULE.length + cycle; d++) {
      const key = addDays(LAUNCH_DATE, d);
      const p = puzzleFor(key)!;
      expect(p.rerun).toBe(true);
      expect(new Set(p.questions.map((q) => q.id)).size).toBe(3);
      expect(puzzleFor(key)!.questions.map((q) => q.id)).toEqual(p.questions.map((q) => q.id));
      p.questions.forEach((q) => {
        expect(seen.has(q.id)).toBe(false);
        seen.add(q.id);
      });
    }
  });
});
