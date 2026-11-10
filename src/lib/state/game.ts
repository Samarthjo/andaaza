import { dayScore, factorOf, guessBin } from '$lib/core/score';
import { puzzleFor, type Puzzle } from '$lib/data/puzzle';
import { accountsEnabled, online, recordAnswer, recordGame } from './online';
import { allGames, loadGame, readJSON, saveGame, sessionId, type SavedGame } from './storage';
import { pushGame } from './sync';

/** Crowd writes still on the wire. Stats reads wait for them so a player always sees their own result counted. */
const inflight = new Set<Promise<unknown>>();
function track<T>(p: Promise<T>): Promise<T> {
  inflight.add(p);
  const drop = () => inflight.delete(p);
  p.then(drop, drop);
  return p;
}
export function recorded(): Promise<void> {
  return Promise.allSettled([...inflight]).then(() => undefined);
}

/** Set by the auth store so game changes can be mirrored for signed-in players. */
let signedIn = false;
export function setSignedIn(v: boolean) {
  signedIn = v;
}
const mirror = (g: SavedGame) => {
  if (accountsEnabled && signedIn) pushGame(g);
};

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
  mirror(next);
  if (online) {
    track(
      recordAnswer({
        session: sessionId(),
        dateKey: puzzle.dateKey,
        mode: next.mode,
        idx,
        questionId: q.id,
        guess,
        factor: factorOf(guess, q.answer),
        bucket: guessBin(guess, q.answer)
      })
    );
  }
  return next;
}

/** Mark a fully guessed game as finished. */
export function finishGame(puzzle: Puzzle, game: SavedGame, nickname: string): SavedGame {
  if (game.completed) return game;
  const done: SavedGame = { ...game, completed: true, completedAt: Date.now() };
  saveGame(done);
  mirror(done);
  if (online && !done.reported) {
    track(
      recordGame({
        session: sessionId(),
        dateKey: puzzle.dateKey,
        mode: done.mode,
        score: dayScore(done.guesses.map((g, i) => factorOf(g, done.answers[i]))),
        nickname
      }).then((r) => {
        if (r !== null) saveGame({ ...done, reported: true });
      })
    );
  }
  return done;
}

export function gameScore(game: SavedGame): number {
  return dayScore(game.guesses.map((g, i) => factorOf(g, game.answers[i])));
}

/**
 * Send finished games that never reached the crowd data (for example, games played
 * before online mode existed, or while offline). Runs once per page load; idempotent on the server.
 */
let pending: Promise<void> | null = null;
export function reportPending(): Promise<void> {
  if (!online) return Promise.resolve();
  pending ??= track(sendPending());
  return pending;
}

async function sendPending() {
  const nickname = readJSON<{ nickname?: string }>('settings', {}).nickname ?? '';
  for (const g of allGames()) {
    if (!g.completed || g.reported || g.guesses.length !== 3) continue;
    const p = puzzleFor(g.dateKey);
    if (!p || p.questions.map((q) => q.id).join() !== g.questionIds.join()) continue;
    await Promise.all(
      p.questions.map((q, idx) =>
        recordAnswer({
          session: sessionId(),
          dateKey: g.dateKey,
          mode: g.mode,
          idx,
          questionId: q.id,
          guess: g.guesses[idx],
          factor: factorOf(g.guesses[idx], q.answer),
          bucket: guessBin(g.guesses[idx], q.answer)
        })
      )
    );
    const r = await recordGame({
      session: sessionId(),
      dateKey: g.dateKey,
      mode: g.mode,
      score: gameScore(g),
      nickname
    });
    if (r !== null) saveGame({ ...(loadGame(g.dateKey) ?? g), reported: true });
  }
}
