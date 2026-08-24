/* Formatting and answer-choice helpers shared by the quant generators. */

import type { Choice } from '@/types/questions';
import { Rng } from './rng';

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/** Round away float noise from decimal arithmetic (0.1 + 0.2 → 0.3). */
export function clean(n: number, places = 6): number {
  return Number(n.toFixed(places));
}

/** Format a number for display: no trailing zeros, thousands separators. */
export function fmt(n: number): string {
  const v = clean(n);
  if (Number.isInteger(v)) return v.toLocaleString('en-US');
  return String(v);
}

export function fmtMoney(n: number): string {
  return `$${fmt(n)}`;
}

export function fmtPercent(n: number): string {
  return `${fmt(n)}%`;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

export function reduce(num: number, den: number): [number, number] {
  const g = gcd(num, den) || 1;
  const sign = den < 0 ? -1 : 1;
  return [(sign * num) / g, (sign * den) / g];
}

/** Render a linear term like `-3x`, `x`, `+ 5`, collapsing unit coefficients. */
export function term(coef: number, variable: string, leading = false): string {
  if (coef === 0) return '';
  const sign = coef < 0 ? '-' : leading ? '' : '+';
  const mag = Math.abs(coef);
  const body = variable ? (mag === 1 ? variable : `${fmt(mag)}${variable}`) : fmt(mag);
  return leading ? `${sign}${body}` : ` ${sign} ${body}`;
}

/**
 * Build answer choices from a correct value and distractors.
 *
 * Distractors are the results of specific plausible errors, not random
 * noise — a test taker who makes the mistake must find their answer here,
 * otherwise the item teaches nothing. Duplicates and collisions with the
 * key are dropped, then the list is topped up with near-miss values.
 */
export function buildChoices(
  rng: Rng,
  correct: number,
  distractors: number[],
  opts: { count?: number; format?: (n: number) => string } = {}
): { choices: Choice[]; correctId: string } {
  const count = opts.count ?? 5;
  const format = opts.format ?? fmt;

  const seen = new Set([clean(correct)]);
  const pool: number[] = [];
  for (const d of distractors) {
    const v = clean(d);
    if (!Number.isFinite(v) || seen.has(v)) continue;
    seen.add(v);
    pool.push(v);
  }

  // Top up with near misses so every item has a full set of choices.
  let guard = 0;
  while (pool.length < count - 1 && guard++ < 200) {
    const base = correct === 0 ? 1 : correct;
    const delta = rng.pick([0.5, 0.75, 1.25, 1.5, 2, -0.5, -0.25]) * base;
    const v = clean(Number.isInteger(correct) ? Math.round(base + delta) : base + delta);
    if (!Number.isFinite(v) || seen.has(v)) continue;
    seen.add(v);
    pool.push(v);
  }

  const values = rng.shuffle([correct, ...pool.slice(0, count - 1)]);
  const choices = values.map((v, i) => ({ id: LETTERS[i], text: format(v) }));
  const correctId = choices[values.findIndex((v) => clean(v) === clean(correct))].id;
  return { choices, correctId };
}

/** Same, for choices that are text rather than numbers. */
export function buildTextChoices(
  rng: Rng,
  correct: string,
  distractors: string[],
  count = 5
): { choices: Choice[]; correctId: string } {
  const seen = new Set([correct]);
  const pool = distractors.filter((d) => !seen.has(d) && seen.add(d));
  const values = rng.shuffle([correct, ...pool.slice(0, count - 1)]);
  const choices = values.map((v, i) => ({ id: LETTERS[i], text: v }));
  return { choices, correctId: choices[values.indexOf(correct)].id };
}

export { LETTERS };
