/**
 * Optional online mode backed by Supabase (PostgREST RPCs, see supabase/migrations).
 * Enabled only when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set at build
 * time. Every call fails soft: the game never depends on the network.
 */
import { BINS } from '$lib/core/score';

const URL_BASE = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

export const online = Boolean(URL_BASE && ANON_KEY);

function headers(): Record<string, string> {
  return {
    apikey: ANON_KEY,
    // Legacy anon keys are JWTs and also go in Authorization; sb_publishable_ keys must not.
    ...(ANON_KEY.startsWith('eyJ') ? { Authorization: `Bearer ${ANON_KEY}` } : {}),
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

export async function leaderboard(range: 'today' | 'week' | 'all', today: string): Promise<BoardRow[] | null> {
  const r = await rpc<BoardRow[]>('andaaza_leaderboard', { p_range: range, p_today: today });
  return r === null ? null : Array.isArray(r) ? r : [];
}

/** Current daily streaks of named players, longest first. */
export async function streaks(today: string): Promise<{ nickname: string; streak: number }[] | null> {
  const r = await rpc<{ nickname: string; streak: number }[]>('andaaza_streaks', { p_today: today });
  return r === null ? null : Array.isArray(r) ? r : [];
}

export function submitQuestion(q: { question: string; answer: string; source: string; name: string }) {
  return rpc<{ ok: boolean }>('andaaza_submit_question', {
    p_question: q.question.slice(0, 400),
    p_answer: q.answer.slice(0, 120),
    p_source: q.source.slice(0, 300),
    p_name: q.name.slice(0, 60)
  });
}
