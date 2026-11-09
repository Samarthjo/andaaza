import type { GameRecord } from '$lib/core/stats';

const PREFIX = 'andaaza:v1:';

function ls(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = ls()?.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    ls()?.setItem(PREFIX + key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeKey(key: string): void {
  try {
    ls()?.removeItem(PREFIX + key);
  } catch {
    /* storage unavailable */
  }
}

/** Saved state for one day's puzzle. */
export interface SavedGame extends GameRecord {
  questionIds: string[];
  startedAt: number;
  completedAt?: number;
  /** Set once the finished game has been sent to the online backend. */
  reported?: boolean;
}

const gameKey = (dateKey: string) => `game:${dateKey}`;

export function loadGame(dateKey: string): SavedGame | null {
  const g = readJSON<SavedGame | null>(gameKey(dateKey), null);
  if (!g || !Array.isArray(g.guesses) || !Array.isArray(g.questionIds)) return null;
  return g;
}

export function saveGame(game: SavedGame): void {
  writeJSON(gameKey(game.dateKey), game);
}

export function allGames(): SavedGame[] {
  const store = ls();
  if (!store) return [];
  const out: SavedGame[] = [];
  try {
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && k.startsWith(PREFIX + 'game:')) {
        const g = loadGame(k.slice((PREFIX + 'game:').length));
        if (g) out.push(g);
      }
    }
  } catch {
    /* ignore */
  }
  return out.sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
}

export function clearAll(): void {
  const store = ls();
  if (!store) return;
  try {
    const keys: string[] = [];
    for (let i = 0; i < store.length; i++) {
      const k = store.key(i);
      if (k && k.startsWith(PREFIX)) keys.push(k);
    }
    keys.forEach((k) => store.removeItem(k));
  } catch {
    /* ignore */
  }
}

/** Anonymous random id used only to group one player's answers in online mode. */
export function sessionId(): string {
  let id = readJSON<string | null>('session', null);
  if (!id) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    writeJSON('session', id);
  }
  return id;
}
