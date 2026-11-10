/**
 * Small, safe arithmetic evaluator for the in-game calculator.
 * Supports + - * / ^ %, parentheses, unary minus, × ÷ − and x for times, π (or pi),
 * implicit multiplication and magnitude words after a value (2 lakh, 3.5 cr, 4k,
 * 1.2 billion). No eval and no identifiers beyond those words.
 */

const MAGNITUDES: Record<string, number> = {
  k: 1e3,
  thousand: 1e3,
  l: 1e5,
  lac: 1e5,
  lakh: 1e5,
  lakhs: 1e5,
  cr: 1e7,
  crore: 1e7,
  crores: 1e7,
  m: 1e6,
  mn: 1e6,
  million: 1e6,
  b: 1e9,
  bn: 1e9,
  billion: 1e9,
  t: 1e12,
  trillion: 1e12
};

type Token =
  | { t: 'num'; v: number }
  | { t: 'mag'; v: number }
  | { t: 'op'; v: '+' | '-' | '*' | '/' | '^' | '%' }
  | { t: 'lp' }
  | { t: 'rp' };

export class CalcError extends Error {}

function tokenize(src: string): Token[] {
  const s = src.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '').toLowerCase();
  const out: Token[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) {
      i++;
    } else if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      // scientific notation: 5e6, 1.2e-3 (but not "5 e")
      if (s[j] === 'e' && /[0-9+-]/.test(s[j + 1] ?? '')) {
        let k = j + 1;
        if (s[k] === '+' || s[k] === '-') k++;
        if (/[0-9]/.test(s[k] ?? '')) {
          while (k < s.length && /[0-9]/.test(s[k])) k++;
          j = k;
        }
      }
      const lit = s.slice(i, j);
      const v = Number(lit);
      if (!Number.isFinite(v)) throw new CalcError(`Bad number "${lit}"`);
      out.push({ t: 'num', v });
      i = j;
    } else if (c === 'π') {
      out.push({ t: 'num', v: Math.PI });
      i++;
    } else if (/[a-z]/.test(c)) {
      let j = i;
      while (j < s.length && /[a-z]/.test(s[j])) j++;
      const word = s.slice(i, j);
      if (word === 'x') out.push({ t: 'op', v: '*' });
      else if (word === 'pi') out.push({ t: 'num', v: Math.PI });
      else {
        const mult = MAGNITUDES[word];
        if (mult === undefined) throw new CalcError(`Unknown word "${word}"`);
        out.push({ t: 'mag', v: mult });
      }
      i = j;
    } else if ('+-*/^%'.includes(c)) {
      out.push({ t: 'op', v: c as '+' });
      i++;
    } else if (c === '(') {
      out.push({ t: 'lp' });
      i++;
    } else if (c === ')') {
      out.push({ t: 'rp' });
      i++;
    } else {
      throw new CalcError(`Unexpected "${c}"`);
    }
  }
  return out;
}

export function evaluate(src: string): number {
  const tokens = tokenize(src);
  if (!tokens.length) throw new CalcError('Empty');
  let pos = 0;
  const peek = () => tokens[pos];
  const isOp = (v: string) => {
    const t = peek();
    return t?.t === 'op' && t.v === v;
  };

  // expr := term (('+'|'-') term)*
  function expr(): number {
    let v = term();
    while (isOp('+') || isOp('-')) {
      const op = (tokens[pos++] as { v: string }).v;
      const r = term();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }
  // term := unary (('*'|'/') unary | implicit-mult unary)*
  function term(): number {
    let v = unary();
    for (;;) {
      if (isOp('*') || isOp('/')) {
        const op = (tokens[pos++] as { v: string }).v;
        const r = unary();
        if (op === '/') {
          if (r === 0) throw new CalcError('Divide by zero');
          v = v / r;
        } else v = v * r;
      } else if (peek()?.t === 'lp' || peek()?.t === 'num') {
        v *= unary();
      } else break;
    }
    return v;
  }
  // unary := ('-'|'+') unary | power
  function unary(): number {
    if (isOp('-')) {
      pos++;
      return -unary();
    }
    if (isOp('+')) {
      pos++;
      return unary();
    }
    return power();
  }
  // power := postfix ('^' unary)?   (right-assoc via unary)
  function power(): number {
    const base = postfix();
    if (isOp('^')) {
      pos++;
      return Math.pow(base, unary());
    }
    return base;
  }
  // postfix := primary (magnitude | '%')*
  function postfix(): number {
    let v = primary();
    for (;;) {
      const t = peek();
      if (t?.t === 'mag') {
        v *= t.v;
        pos++;
      } else if (t?.t === 'op' && t.v === '%') {
        v /= 100;
        pos++;
      } else break;
    }
    return v;
  }
  function primary(): number {
    const t = peek();
    if (!t) throw new CalcError('Unexpected end');
    if (t.t === 'num') {
      pos++;
      return t.v;
    }
    if (t.t === 'lp') {
      pos++;
      const v = expr();
      if (peek()?.t !== 'rp') throw new CalcError('Missing )');
      pos++;
      return v;
    }
    if (t.t === 'mag') throw new CalcError('Magnitude needs a number before it');
    throw new CalcError('Unexpected operator');
  }

  const value = expr();
  if (pos !== tokens.length) throw new CalcError('Unexpected input');
  if (!Number.isFinite(value)) throw new CalcError('Not a number');
  return value;
}

export function tryEvaluate(src: string): number | null {
  try {
    return evaluate(src);
  } catch {
    return null;
  }
}
