import { describe, expect, it } from 'vitest';
import type { SavedGame } from './storage';
import { isSavedGame, mergeGame } from './sync';

const game = (over: Partial<SavedGame> = {}): SavedGame => ({
  dateKey: '2026-11-10',
  mode: 'daily',
  questionIds: ['a', 'b', 'c'],
  answers: [10, 20, 30],
  guesses: [],
  completed: false,
  startedAt: 1,
  ...over
});

describe('isSavedGame', () => {
  it('accepts a saved game', () => {
    expect(isSavedGame(game({ guesses: [5, 6] }))).toBe(true);
  });

  it('rejects junk from the server', () => {
    expect(isSavedGame(null)).toBe(false);
    expect(isSavedGame('game')).toBe(false);
    expect(isSavedGame({ ...game(), guesses: [5, -1] })).toBe(false);
    expect(isSavedGame({ ...game(), guesses: ['5'] })).toBe(false);
    expect(isSavedGame({ ...game(), completed: 'yes' })).toBe(false);
    const { dateKey: _, ...noDate } = game();
    expect(isSavedGame(noDate)).toBe(false);
  });
});

describe('mergeGame', () => {
  it('keeps whichever copy exists', () => {
    const g = game();
    expect(mergeGame(g, null)).toBe(g);
    expect(mergeGame(null, g)).toBe(g);
    expect(mergeGame(null, null)).toBe(null);
  });

  it('prefers the finished copy', () => {
    const local = game({ guesses: [1, 2] });
    const remote = game({ guesses: [3, 4, 5], completed: true });
    expect(mergeGame(local, remote)).toBe(remote);
    expect(mergeGame(remote, local)).toBe(remote);
  });

  it('otherwise prefers the copy with more guesses, keeping local on a tie', () => {
    const local = game({ guesses: [1] });
    const remote = game({ guesses: [1, 2] });
    expect(mergeGame(local, remote)).toBe(remote);
    const tie = game({ guesses: [9] });
    expect(mergeGame(local, tie)).toBe(local);
  });
});
