export type NumberStyle = 'indian' | 'international';

const SUFFIXES: Record<string, number> = {
  k: 1e3,
  thousand: 1e3,
  hazar: 1e3,
  hazaar: 1e3,
  l: 1e5,
  lac: 1e5,
  lacs: 1e5,
  lakh: 1e5,
  lakhs: 1e5,
  cr: 1e7,
  crs: 1e7,
  crore: 1e7,
  crores: 1e7,
  m: 1e6,
  mn: 1e6,
  mil: 1e6,
  million: 1e6,
  millions: 1e6,
  b: 1e9,
  bn: 1e9,
  billion: 1e9,
  billions: 1e9,
  t: 1e12,
  tn: 1e12,
  trillion: 1e12,
  trillions: 1e12,
  'lakh crore': 1e12,
  'lakh crores': 1e12,
  'lakh cr': 1e12,
  'lac crore': 1e12,
  'l cr': 1e12,
  lcr: 1e12
};

const NUMBER_RE = /^(\d+(?:\.\d+)?|\.\d+)(?:e([+-]?\d+))?\s*([a-z][a-z ]*)?$/;

/**
 * Parse a guess typed by a player. Understands Indian grouping (12,34,567),
 * lakh/crore words, k/M/B shorthands and scientific notation.
 * Returns null for anything that is not a positive finite number.
 */
export function parseGuess(raw: string): number | null {
  if (typeof raw !== 'string') return null;
  const cleaned = raw
    .toLowerCase()
    .replace(/[₹,_'’\s]+/g, (m) => (/\s/.test(m) ? ' ' : ''))
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleaned) return null;
  const match = NUMBER_RE.exec(cleaned);
  if (!match) return null;
  const [, base, exp, suffixRaw] = match;
  let value = Number(base);
  if (exp) value *= 10 ** Number(exp);
  if (suffixRaw) {
    const suffix = suffixRaw.trim();
    const mult = SUFFIXES[suffix];
    if (mult === undefined) return null;
    value *= mult;
  }
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

/** Strip characters that can never be part of a guess, keeping what the player typed readable. */
export function sanitizeGuessInput(raw: string): string {
  return raw.replace(/[^0-9a-zA-Z.,₹ +\-e]/g, '').slice(0, 32);
}

function trimZeros(s: string): string {
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}

/** Round to `sig` significant figures. */
export function roundSig(n: number, sig = 3): number {
  if (!Number.isFinite(n) || n === 0) return n;
  const p = Math.pow(10, sig - Math.ceil(Math.log10(Math.abs(n))));
  return Math.round(n * p) / p;
}

const indianFmt = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 });
const intlFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

/** Full number with digit grouping (12,34,567 in Indian style). */
export function formatGrouped(n: number, style: NumberStyle = 'indian'): string {
  if (!Number.isFinite(n)) return '∞';
  const v = Math.abs(n) >= 100 ? Math.round(n) : n;
  return (style === 'indian' ? indianFmt : intlFmt).format(v);
}

const INDIAN_UNITS: [number, string][] = [
  [1e12, 'lakh crore'],
  [1e7, 'crore'],
  [1e5, 'lakh'],
  [1e3, 'thousand']
];
const INTL_UNITS: [number, string][] = [
  [1e12, 'trillion'],
  [1e9, 'billion'],
  [1e6, 'million'],
  [1e3, 'thousand']
];

/** Human words for big numbers: 2.5 crore / 25 million. Small numbers are returned grouped. */
export function formatWords(n: number, style: NumberStyle = 'indian', sig = 3): string {
  if (!Number.isFinite(n)) return '∞';
  const units = style === 'indian' ? INDIAN_UNITS : INTL_UNITS;
  const abs = Math.abs(n);
  for (const [size, word] of units) {
    if (abs >= size) {
      const scaled = roundSig(n / size, sig);
      // 1,000 lakh crore reads better than 10 lakh crore crore; keep grouping for big multiples.
      return `${trimZeros(formatGrouped(scaled, style))} ${word}`;
    }
  }
  return formatGrouped(roundSig(n, Math.max(sig, 4)), style);
}

/** Short form used inside tight UI (axis labels): 2.5Cr, 40L, 3K / 25M, 1.2B. */
export function formatCompact(n: number, style: NumberStyle = 'indian'): string {
  if (!Number.isFinite(n)) return '∞';
  const abs = Math.abs(n);
  const units: [number, string][] =
    style === 'indian'
      ? [
          [1e12, 'L Cr'],
          [1e7, 'Cr'],
          [1e5, 'L'],
          [1e3, 'K']
        ]
      : [
          [1e12, 'T'],
          [1e9, 'B'],
          [1e6, 'M'],
          [1e3, 'K']
        ];
  for (const [size, label] of units) {
    if (abs >= size) {
      const v = roundSig(n / size, 2);
      return `${trimZeros(v >= 100 ? String(Math.round(v)) : v.toString())}${label}`;
    }
  }
  return trimZeros(roundSig(n, 2).toString());
}

/** Format a multiplicative factor: 1.07×, 12.4×, 1,453×, 2.2Cr× (very wild guesses stay short). */
export function formatFactor(f: number): string {
  if (!Number.isFinite(f)) return '∞×';
  if (f < 10) return `${f.toFixed(2)}×`;
  if (f < 100) return `${f.toFixed(1)}×`;
  if (f < 10_000) return `${indianFmt.format(Math.round(f))}×`;
  return `${formatCompact(f)}×`;
}

/** Answer with unit, e.g. "₹615 crore" or "6,40,867 villages". */
export function formatWithUnit(
  n: number,
  unit: { prefix?: string; label: string },
  style: NumberStyle = 'indian',
  words = false
): string {
  const body = words ? formatWords(n, style) : formatGrouped(n, style);
  return `${unit.prefix ?? ''}${body}${unit.label ? ' ' + unit.label : ''}`;
}
