/**
 * Cross-device sync for signed-in players: games live in localStorage and are mirrored
 * to the andaaza_user_games table (RLS: each player sees only their own rows).
 */
import { fetchUserGames, upsertUserGames } from './online';
import { allGames, loadGame, saveGame, type SavedGame } from './storage';

export function isSavedGame(v: unknown): v is SavedGame {
  if (!v || typeof v !== 'object') return false;
  const g = v as Record<string, unknown>;
  return (
    typeof g.dateKey === 'string' &&
    Array.isArray(g.guesses) &&
    g.guesses.every((x) => typeof x === 'number' && x > 0) &&
    Array.isArray(g.answers) &&
    Array.isArray(g.questionIds) &&
    typeof g.completed === 'boolean'
  );
}

/** Pick the more advanced of two copies of the same day's game. */
export function mergeGame(local: SavedGame | null, remote: SavedGame | null): SavedGame | null {
  if (!remote) return local;
  if (!local) return remote;
  if (remote.completed !== local.completed) return remote.completed ? remote : local;
  return remote.guesses.length > local.guesses.length ? remote : local;
}

let syncing: Promise<void> | null = null;

/** Pull this player's games, merge into this device, then push anything newer. */
export function syncGames(): Promise<void> {
  if (syncing) return syncing;
  syncing = (async () => {
    const remote = await fetchUserGames();
    if (remote === null) return;
    const remoteByDate = new Map<string, SavedGame>();
    for (const row of Array.isArray(remote) ? remote : []) {
      if (isSavedGame(row.game) && row.game.dateKey === row.puzzle_date) remoteByDate.set(row.puzzle_date, row.game);
    }
    for (const [date, r] of remoteByDate) {
      const local = loadGame(date);
      const merged = mergeGame(local, r);
      if (merged && merged !== local) saveGame(merged);
    }
    const toPush = allGames().filter((g) => {
      const r = remoteByDate.get(g.dateKey);
      return (
        g.guesses.length > 0 &&
        mergeGame(r ?? null, g) === g &&
        (!r || r.completed !== g.completed || r.guesses.length !== g.guesses.length)
      );
    });
    await upsertUserGames(toPush.map((g) => ({ puzzle_date: g.dateKey, game: g })));
  })().finally(() => {
    syncing = null;
  });
  return syncing;
}

/** Push one game after it changes (signed-in players only; callers check). */
export function pushGame(game: SavedGame) {
  return upsertUserGames([{ puzzle_date: game.dateKey, game }]);
}
