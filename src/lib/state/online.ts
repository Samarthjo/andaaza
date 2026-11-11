/**
 * Optional online mode backed by Supabase (PostgREST RPCs, see supabase/migrations).
 * Enabled only when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set at build
 * time. Every call fails soft: the game never depends on the network.
 */
import { BINS } from '$lib/core/score';

const URL_BASE = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

export const online = Boolean(URL_BASE && ANON_KEY);
/** Sign-in, theme unlocks and cross-device sync (needs Supabase Auth URLs configured). */
export const accountsEnabled = online && import.meta.env.VITE_ACCOUNTS === '1';
export const SUPABASE_URL = URL_BASE;
export const SUPABASE_KEY = ANON_KEY;

/** Access token and id of the signed-in player, set by the auth store. Null for guests. */
let accessToken: string | null = null;
let userId: string | null = null;
export function setAuth(token: string | null, id: string | null) {
  accessToken = token;
  userId = id;
}

function headers(): Record<string, string> {
  const bearer = accessToken ?? (ANON_KEY.startsWith('eyJ') ? ANON_KEY : null);
  return {
    apikey: ANON_KEY,
    // Legacy anon keys and user sessions are JWTs and go in Authorization; sb_publishable_ keys must not.
    ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    'Content-Type': 'application/json'
  };
}

async function request<T>(path: string, init: RequestInit, timeoutMs = 6000): Promise<T | null> {
  if (!online) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${URL_BASE}${path}`, {
      ...init,
      headers: { ...headers(), ...(init.headers ?? {}) },
      signal: ctrl.signal
    });
    if (!res.ok) return null;
    const text = await res.text();
    // Void functions answer 204 with no body: report success as an empty object, failure as null.
    return (text ? JSON.parse(text) : {}) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function rpc<T>(fn: string, args: Record<string, unknown>, timeoutMs = 6000): Promise<T | null> {
  return request<T>(`/rest/v1/rpc/${fn}`, { method: 'POST', body: JSON.stringify(args) }, timeoutMs);
}

/** Signed-in only: this player's synced games. */
export function fetchUserGames() {
  return request<{ puzzle_date: string; game: unknown }[]>('/rest/v1/andaaza_user_games?select=puzzle_date,game', {
    method: 'GET'
  });
}

/** Signed-in only: save or update synced games. */
export function upsertUserGames(rows: { puzzle_date: string; game: unknown }[]) {
  if (!rows.length || !userId) return Promise.resolve(rows.length ? null : {});
  const now = new Date().toISOString();
  return request('/rest/v1/andaaza_user_games', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows.map((r) => ({ user_id: userId, ...r, updated_at: now })))
  });
}

/** A signed-in player's profile row (andaaza_profiles). */
export interface Profile {
  name: string | null;
  palette: string | null;
  theme: string | null;
  number_style: string | null;
}

/** Signed-in only: this player's profile, or null when it can't be read. */
export async function fetchProfile(): Promise<Profile | null> {
  const rows = await request<Profile[]>('/rest/v1/andaaza_profiles?select=name,palette,theme,number_style', { method: 'GET' });
  if (!Array.isArray(rows)) return null;
  return rows[0] ?? { name: null, palette: null, theme: null, number_style: null };
}

/** Signed-in only: create or update fields of this player's profile. */
export function saveProfile(patch: Partial<Profile>) {
  if (!userId) return Promise.resolve(null);
  return request('/rest/v1/andaaza_profiles', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ user_id: userId, ...patch, updated_at: new Date().toISOString() })
  });
}

/** Which sign-in methods the Supabase project has switched on (public endpoint). */
export async function authProviders(): Promise<{ email: boolean; google: boolean }> {
  const s = await request<{ external?: Record<string, boolean> }>('/auth/v1/settings', { method: 'GET' });
  return { email: s?.external?.email !== false, google: s?.external?.google === true };
}

export function recordAnswer(a: {
  session: string;
  dateKey: string;
  mode: 'daily' | 'archive';
  idx: number;
  questionId: string;
  guess: number;
  factor: number;
  bucket: number;
}) {
  return rpc('andaaza_record_answer', {
    p_session: a.session,
    p_date: a.dateKey,
    p_mode: a.mode,
    p_idx: a.idx,
    p_question_id: a.questionId,
    p_guess: a.guess,
    p_factor: Number.isFinite(a.factor) ? a.factor : 1e9,
    p_bucket: a.bucket
  });
}

export function recordGame(g: { session: string; dateKey: string; mode: 'daily' | 'archive'; score: number; nickname: string }) {
  return rpc('andaaza_record_game', {
    p_session: g.session,
    p_date: g.dateKey,
    p_mode: g.mode,
    p_score: g.score,
    p_nickname: g.nickname.slice(0, 24) || null
  });
}

export interface PuzzleStats {
  players: number;
  /** One array of BINS (21) guess counts per question index. */
  buckets: number[][];
  /** Day-score histogram, BINS (21) bins from 1× to 1000×. */
  scores: number[];
}

export async function puzzleStats(dateKey: string): Promise<PuzzleStats | null> {
  const r = await rpc<PuzzleStats>('andaaza_puzzle_stats', { p_date: dateKey });
  if (!r || !Array.isArray(r.buckets)) return null;
  const ok = (b: unknown): b is number[] => Array.isArray(b) && b.length === BINS;
  r.buckets = r.buckets.map((b) => (ok(b) ? b : Array(BINS).fill(0)));
  if (!ok(r.scores)) r.scores = Array(BINS).fill(0);
  return r;
}

export interface BoardRow {
  nickname: string;
  score: number;
  games: number;
}

export async function leaderboard(range: 'today' | 'week', today: string): Promise<BoardRow[] | null> {
  return rpc<BoardRow[]>('andaaza_leaderboard', {
    p_range: range,
    p_today: today
  });
}

export function submitQuestion(q: { question: string; answer: string; source: string; name: string }) {
  return rpc<{ ok: boolean }>('andaaza_submit_question', {
    p_question: q.question.slice(0, 400),
    p_answer: q.answer.slice(0, 120),
    p_source: q.source.slice(0, 300),
    p_name: q.name.slice(0, 60)
  });
}
