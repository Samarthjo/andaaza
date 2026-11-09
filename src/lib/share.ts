import { base } from '$app/paths';
import { formatShortDate } from '$lib/core/date';
import { formatFactor } from '$lib/core/number';
import { dayScore, emojiFor, factorOf, sideOf, verdictFor } from '$lib/core/score';
import type { Puzzle } from '$lib/data/puzzle';

export function siteUrl(): string {
  const env = import.meta.env.VITE_SITE_URL;
  if (env) return env.replace(/\/$/, '');
  return typeof location !== 'undefined' ? location.origin + base : '';
}

function rows(puzzle: Puzzle, guesses: number[]) {
  return puzzle.questions.map((q, i) => {
    const f = factorOf(guesses[i], q.answer);
    const side = sideOf(guesses[i], q.answer);
    return { f, arrow: side === 'high' ? '⬆️' : side === 'low' ? '⬇️' : '✅', emoji: emojiFor(f) };
  });
}

export function shareText(puzzle: Puzzle, guesses: number[]): string {
  const r = rows(puzzle, guesses);
  const score = dayScore(r.map((x) => x.f));
  return [
    `Andaaza No. ${puzzle.number} (${formatShortDate(puzzle.dateKey)})`,
    `Score ${formatFactor(score)}`,
    ...r.map((x) => `${x.emoji}${x.arrow} ${formatFactor(x.f)}`),
    siteUrl()
  ]
    .filter(Boolean)
    .join('\n');
}

function cssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined') return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/** Draw a 1080×1350 share image in the current palette. */
export async function shareImage(puzzle: Puzzle, guesses: number[]): Promise<Blob | null> {
  if (typeof document === 'undefined') return null;
  try {
    await document.fonts?.ready;
  } catch {
    /* fonts optional */
  }
  const W = 1080;
  const H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return null;

  const page = cssVar('--page', '#fbf1c7');
  const ink = cssVar('--ink', '#1e2747');
  const soft = cssVar('--ink-soft', '#4d5577');
  const rule = cssVar('--rule', '#ead48d');
  const margin = cssVar('--margin', '#d9544f');
  const binding = cssVar('--binding', '#9e1b1b');
  const display = '"Rozha One", Georgia, serif';
  const ui = '"Mukta", system-ui, sans-serif';

  ctx.fillStyle = page;
  ctx.fillRect(0, 0, W, H);
  // ledger rules
  ctx.fillStyle = rule;
  for (let y = 180; y < H; y += 64) ctx.fillRect(0, y, W, 2);
  // binding strip and double margin line
  ctx.fillStyle = binding;
  ctx.fillRect(0, 0, W, 120);
  ctx.fillStyle = margin;
  ctx.fillRect(110, 120, 4, H);
  ctx.fillRect(122, 120, 4, H);

  const r = rows(puzzle, guesses);
  const score = dayScore(r.map((x) => x.f));
  const x0 = 170;

  ctx.fillStyle = cssVar('--binding-ink', '#fff6da');
  ctx.font = `64px ${display}`;
  ctx.textBaseline = 'middle';
  ctx.fillText('Andaaza', 60, 62);
  ctx.font = `600 36px ${ui}`;
  ctx.textAlign = 'right';
  ctx.fillText(`No. ${puzzle.number}  ${formatShortDate(puzzle.dateKey)}`, W - 60, 64);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  ctx.fillStyle = soft;
  ctx.font = `500 40px ${ui}`;
  ctx.fillText('Day’s total', x0, 300);

  ctx.fillStyle = ink;
  ctx.font = `220px ${display}`;
  const scoreText = formatFactor(score);
  ctx.fillText(scoreText, x0, 520);
  const sw = ctx.measureText(scoreText).width;
  ctx.fillRect(x0, 556, sw, 6);
  ctx.fillRect(x0, 572, sw, 6);

  ctx.font = `64px ${display}`;
  ctx.fillText(verdictFor(score).label, x0, 680);

  ctx.font = `600 56px ${ui}`;
  r.forEach((row, i) => {
    const y = 840 + i * 128;
    ctx.fillStyle = ink;
    ctx.fillText(`${row.emoji} ${row.arrow}`, x0, y);
    ctx.font = `76px ${display}`;
    ctx.fillText(formatFactor(row.f), x0 + 230, y + 6);
    ctx.font = `500 40px ${ui}`;
    ctx.fillStyle = soft;
    ctx.fillText(`Q${i + 1}`, W - 150, y);
    ctx.font = `600 56px ${ui}`;
  });

  ctx.fillStyle = soft;
  ctx.font = `500 38px ${ui}`;
  ctx.fillText(siteUrl().replace(/^https?:\/\//, '') || 'Andaaza', x0, H - 70);

  return new Promise((resolve) => c.toBlob((b) => resolve(b), 'image/png'));
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

/** Share via the OS sheet when possible, else download the image. Returns what happened. */
export async function shareCard(puzzle: Puzzle, guesses: number[]): Promise<'shared' | 'downloaded' | 'failed'> {
  const blob = await shareImage(puzzle, guesses);
  if (!blob) return 'failed';
  const file = new File([blob], `andaaza-${puzzle.number}.png`, { type: 'image/png' });
  const text = shareText(puzzle, guesses);
  try {
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], text });
      return 'shared';
    }
  } catch (e) {
    if ((e as Error)?.name === 'AbortError') return 'failed';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return 'downloaded';
}
