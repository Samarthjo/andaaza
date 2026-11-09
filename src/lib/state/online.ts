/**
 * Optional online mode backed by Supabase (PostgREST RPCs, see supabase/migrations).
 * Enabled only when VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set at build
 * time. Every call fails soft: the game never depends on the network.
 */
import { BUCKET_COUNT } from '$lib/core/score';

const URL_BASE = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const ANON_KEY = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

export const online = Boolean(URL_BASE && ANON_KEY);

async function rpc<T>(fn: string, args: Record<string, unknown>, timeoutMs = 6000): Promise<T | null> {
  if (!online) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${URL_BASE}/rest/v1/rpc/${fn}`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(args),
      signal: ctrl.signal
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text ? (JSON.parse(text) as T) : (null as T);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
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
  /** One array of BUCKET_COUNT counts per question index. */
  buckets: number[][];
  /** Day-score histogram, aligned with SCORE_EDGES. */
  scores: number[];
}

export async function puzzleStats(dateKey: string): Promise<PuzzleStats | null> {
  const r = await rpc<PuzzleStats>('andaaza_puzzle_stats', { p_date: dateKey });
  if (!r || !Array.isArray(r.buckets)) return null;
  r.buckets = r.buckets.map((b) => (Array.isArray(b) && b.length === BUCKET_COUNT ? b : Array(BUCKET_COUNT).fill(0)));
  return r;
}

export interface BoardRow {
  nickname: string;
  score: number;
  games: number;
}

export async function leaderboard(range: 'today' | 'week', today: string): Promise<BoardRow[] | null> {
  return rpc<BoardRow[]>('andaaza_leaderboard', { p_range: range, p_today: today });
}

export function submitQuestion(q: { question: string; answer: string; source: string; name: string }) {
  return rpc<{ ok: boolean }>('andaaza_submit_question', {
    p_question: q.question.slice(0, 400),
    p_answer: q.answer.slice(0, 120),
    p_source: q.source.slice(0, 300),
    p_name: q.name.slice(0, 60)
  });
}
