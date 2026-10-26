/* The on-screen calculator model (ETS "Guidelines to Using the On-screen Calculator").
 *
 * Facts implemented from that document: operations respect the order of
 * operations (parentheses, exponentiation/roots, × ÷ left to right, + −
 * left to right); parentheses; one memory with MC / MR / M+; Transfer Display;
 * eight-digit display; results above 99,999,999 show ERROR; positive results
 * below 10⁻⁷ show 0; division by zero and square roots of negatives show ERROR.
 * While ERROR is displayed only clear does anything.
 */

export type Token = number | '+' | '-' | '*' | '/' | '(' | ')';

export interface CalcState {
  /** Tokens entered so far, excluding the number being typed. */
  tokens: Token[];
  /** The number being typed, as text ("" when none). */
  entry: string;
  /** What the display shows when no entry is in progress. */
  shown: string;
  memory: number;
  error: boolean;
  /** The last result can be overwritten by typing a digit. */
  fresh: boolean;
}

export const initialCalc = (): CalcState => ({ tokens: [], entry: '', shown: '0', memory: 0, error: false, fresh: true });

export type Key =
  | { k: 'digit'; d: string }
  | { k: 'dot' }
  | { k: 'op'; op: '+' | '-' | '*' | '/' }
  | { k: 'paren'; p: '(' | ')' }
  | { k: 'sqrt' }
  | { k: 'sign' }
  | { k: 'equals' }
  | { k: 'clear' }
  | { k: 'mc' }
  | { k: 'mr' }
  | { k: 'mplus' };

const MAX = 99_999_999;

/** Format a result for an eight-digit display, or null for ERROR. */
export function formatResult(n: number): string | null {
  if (!Number.isFinite(n) || Math.abs(n) > MAX) return null;
  if (n !== 0 && Math.abs(n) < 1e-7) return '0';
  const neg = n < 0;
  const abs = Math.abs(n);
  const intDigits = Math.floor(abs).toString().length;
  const decimals = Math.max(0, 8 - (abs < 1 ? 1 : intDigits));
  let s = abs.toFixed(decimals);
  if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
  if (s.replace('.', '').length > 8 && !s.includes('.')) return null;
  return (neg ? '-' : '') + s;
}

/** Evaluate tokens with standard precedence. Returns null on a math error. */
export function evaluate(tokens: Token[]): number | null {
  let i = 0;
  const peek = () => tokens[i];
  const parseExpr = (): number | null => {
    let left = parseTerm();
    if (left === null) return null;
    while (peek() === '+' || peek() === '-') {
      const op = tokens[i++];
      const right = parseTerm();
      if (right === null) return null;
      left = op === '+' ? left + right : left - right;
    }
    return left;
  };
  const parseTerm = (): number | null => {
    let left = parseFactor();
    if (left === null) return null;
    while (peek() === '*' || peek() === '/') {
      const op = tokens[i++];
      const right = parseFactor();
      if (right === null) return null;
      if (op === '/' && right === 0) return null;
      left = op === '*' ? left * right : left / right;
    }
    return left;
  };
  const parseFactor = (): number | null => {
    const t = tokens[i++];
    if (t === '-') {
      const v = parseFactor();
      return v === null ? null : -v;
    }
    if (typeof t === 'number') return t;
    if (t === '(') {
      const v = parseExpr();
      if (v === null || tokens[i++] !== ')') return null;
      return v;
    }
    return null;
  };
  const v = parseExpr();
  return v === null || i !== tokens.length ? null : v;
}

const num = (s: string) => Number(s === '' || s === '-' || s === '.' ? '0' : s);

function fail(s: CalcState): CalcState {
  return { ...s, tokens: [], entry: '', shown: 'ERROR', error: true, fresh: true };
}

function commitEntry(s: CalcState): Token[] {
  return s.entry !== '' ? [...s.tokens, num(s.entry)] : s.tokens;
}

export function press(state: CalcState, key: Key): CalcState {
  if (key.k === 'clear') return { ...initialCalc(), memory: state.memory };
  if (state.error) return state;

  switch (key.k) {
    case 'digit': {
      const base = state.fresh ? '' : state.entry;
      const next = base === '0' ? key.d : base === '-0' ? '-' + key.d : base + key.d;
      if (next.replace(/[-.]/g, '').length > 8) return state;
      return { ...state, entry: next, shown: next, fresh: false };
    }
    case 'dot': {
      const base = state.fresh ? '' : state.entry;
      if (base.includes('.')) return state;
      const next = (base === '' ? '0' : base) + '.';
      return { ...state, entry: next, shown: next, fresh: false };
    }
    case 'sign': {
      if (state.entry !== '') {
        const next = state.entry.startsWith('-') ? state.entry.slice(1) : '-' + state.entry;
        return { ...state, entry: next, shown: next };
      }
      const cur = Number(state.shown);
      if (!Number.isFinite(cur)) return state;
      const next = cur === 0 ? '-0' : String(-cur);
      return { ...state, entry: next, shown: next, fresh: false };
    }
    case 'op': {
      let tokens = commitEntry(state);
      if (tokens.length === 0) tokens = [Number(state.shown)];
      const last = tokens[tokens.length - 1];
      if (typeof last === 'string' && last !== ')' && last !== '(') tokens = [...tokens.slice(0, -1)];
      return { ...state, tokens: [...tokens, key.op], entry: '', fresh: true };
    }
    case 'paren': {
      if (key.p === '(') {
        const tokens = state.entry !== '' ? [...state.tokens, num(state.entry), '*' as Token] : state.tokens;
        return { ...state, tokens: [...tokens, '('], entry: '', fresh: true };
      }
      return { ...state, tokens: [...commitEntry(state), ')'], entry: '', fresh: true };
    }
    case 'sqrt': {
      const cur = state.entry !== '' ? num(state.entry) : Number(state.shown);
      if (cur < 0) return fail(state);
      const r = formatResult(Math.sqrt(cur));
      if (r === null) return fail(state);
      return { ...state, entry: r, shown: r, fresh: false };
    }
    case 'equals': {
      const tokens = commitEntry(state);
      if (tokens.length === 0) return state;
      const v = evaluate(tokens);
      if (v === null) return fail(state);
      const r = formatResult(v);
      if (r === null) return fail(state);
      return { ...state, tokens: [], entry: '', shown: r, fresh: true };
    }
    case 'mc':
      return { ...state, memory: 0 };
    case 'mplus': {
      const cur = state.entry !== '' ? num(state.entry) : Number(state.shown);
      const m = state.memory + cur;
      return formatResult(m) === null ? fail(state) : { ...state, memory: m };
    }
    case 'mr': {
      const r = formatResult(state.memory);
      if (r === null) return fail(state);
      return { ...state, entry: r, shown: r, fresh: false };
    }
  }
}

/** The text on the display, including the expression being built. */
export function display(s: CalcState): string {
  return s.shown;
}

/** Transfer Display: the value to copy into a single-box Numeric Entry answer. */
export function transferValue(s: CalcState): string | null {
  if (s.error) return null;
  return s.entry !== '' ? s.entry : s.shown;
}
