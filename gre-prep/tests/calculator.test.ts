import { describe, expect, it } from 'vitest';
import { initialCalc, press, transferValue, type CalcState, type Key } from '@/lib/calculator';
import { splitSentences } from '@/lib/sentences';

const keys = (s: string): Key[] =>
  [...s].map((c): Key => {
    if (/\d/.test(c)) return { k: 'digit', d: c };
    if (c === '.') return { k: 'dot' };
    if (c === '+' || c === '-' || c === '*' || c === '/') return { k: 'op', op: c };
    if (c === '(' || c === ')') return { k: 'paren', p: c };
    if (c === '=') return { k: 'equals' };
    if (c === 'r') return { k: 'sqrt' };
    throw new Error(c);
  });
const run = (s: string, from: CalcState = initialCalc()) => keys(s).reduce(press, from);

describe('on-screen calculator (ETS guidelines)', () => {
  it('respects order of operations: 1 + 2 × 4 = 9, not 12', () => {
    expect(run('1+2*4=').shown).toBe('9');
  });
  it('handles parentheses', () => {
    expect(run('(1+2)*4=').shown).toBe('12');
  });
  it('division by zero is ERROR and only clear recovers', () => {
    const e = run('5/0=');
    expect(e.shown).toBe('ERROR');
    expect(press(e, { k: 'digit', d: '3' }).shown).toBe('ERROR');
    expect(press(e, { k: 'clear' }).shown).toBe('0');
  });
  it('square root of a negative is ERROR', () => {
    const s = press(press(initialCalc(), { k: 'sign' }), { k: 'digit', d: '4' });
    expect(press(s, { k: 'sqrt' }).shown).toBe('ERROR');
  });
  it('results above 99,999,999 are ERROR', () => {
    expect(run('99999999+1=').shown).toBe('ERROR');
    expect(run('99999999*1=').shown).toBe('99999999');
  });
  it('tiny positive results display 0', () => {
    expect(run('1/99999999/99999999=').shown).toBe('0');
  });
  it('displays at most eight digits', () => {
    expect(run('1/3=').shown).toBe('0.3333333');
    expect(run('2r').shown.replace('.', '').length).toBeLessThanOrEqual(8);
  });
  it('memory: M+, MR, MC', () => {
    let s = run('12');
    s = press(s, { k: 'mplus' });
    s = press(press(s, { k: 'clear' }), { k: 'mr' });
    expect(s.shown).toBe('12');
    s = press(press(s, { k: 'mc' }), { k: 'mr' });
    expect(s.shown).toBe('0');
  });
  it('transfer display returns the shown value', () => {
    expect(transferValue(run('6*7='))).toBe('42');
    expect(transferValue(run('1/0='))).toBeNull();
  });
});

describe('splitSentences', () => {
  it('splits plain sentences', () => {
    expect(splitSentences('One two. Three four! Five six?')).toEqual(['One two.', 'Three four!', 'Five six?']);
  });
  it('does not split after abbreviations', () => {
    expect(splitSentences('Dr. Lee wrote it, e.g. in 1999. It sold well.')).toEqual(['Dr. Lee wrote it, e.g. in 1999.', 'It sold well.']);
  });
  it('keeps closing quotes with the sentence', () => {
    expect(splitSentences('She said “stop.” He did.')).toEqual(['She said “stop.”', 'He did.']);
  });
});
