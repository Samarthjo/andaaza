import { bucketOf, dayScore, factorOf } from '$lib/core/score';
import type { Puzzle } from '$lib/data/puzzle';
import { online, recordAnswer, recordGame } from './online';
import { loadGame, saveGame, sessionId, type SavedGame } from './storage';

/** Load the saved game for a puzzle, or start a fresh one (not saved until the first guess). */
export function openGame(puzzle: Puzzle, today: string): SavedGame {
  const ids = puzzle.questions.map((q) => q.id);
  const saved = loadGame(puzzle.dateKey);
  if (saved && saved.questionIds.join() === ids.join()) return saved;
  return {
    dateKey: puzzle.dateKey,
    mode: puzzle.dateKey === today ? 'daily' : 'archive',
    questionIds: ids,
    answers: puzzle.questions.map((q) => q.answer),
    guesses: [],
    completed: false,
    startedAt: Date.now()
  };
}

/** Lock the next guess. Returns the updated game, or null if the guess is out of turn. */
export function lockGuess(puzzle: Puzzle, game: SavedGame, guess: number): SavedGame | null {
  if (game.completed || !(guess > 0)) return null;
  const idx = game.guesses.length;
  const q = puzzle.questions[idx];
  if (!q) return null;
  const next: SavedGame = { ...game, guesses: [...game.guesses, guess] };
  saveGame(next);
  if (online) {
    recordAnswer({
      session: sessionId(),
      dateKey: puzzle.dateKey,
      mode: next.mode,
      idx,
      questionId: q.id,
      guess,
      factor: factorOf(guess, q.answer),
      bucket: bucketOf(guess, q.answer)
    });
  }
  return next;
}

/** Mark a fully guessed game as finished. */
export function finishGame(puzzle: Puzzle, game: SavedGame, nickname: string): SavedGame {
  if (game.completed) return game;
  const done: SavedGame = { ...game, completed: true, completedAt: Date.now() };
  saveGame(done);
  if (online && !done.reported) {
    recordGame({
      session: sessionId(),
      dateKey: puzzle.dateKey,
      mode: done.mode,
      score: dayScore(done.guesses.map((g, i) => factorOf(g, done.answers[i]))),
      nickname
    }).then((r) => {
      if (r !== null) saveGame({ ...done, reported: true });
    });
  }
  return done;
}

export function gameScore(game: SavedGame): number {
  return dayScore(game.guesses.map((g, i) => factorOf(g, game.answers[i])));
}
