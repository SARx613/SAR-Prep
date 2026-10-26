import { QC_CHOICES } from '@/types/questions';
import type { Choice, TCContent } from '@/types/questions';
import type { Response } from '@/lib/grading';
import type { ClientQuestion } from '@/content/types';

/* What the learner has entered for one question, and how it maps to a
 * grading Response. Held by the player so a whole item is graded at once —
 * the GRE gives no partial credit. */

export interface Selection {
  ids: string[];
  blanks: (string | null)[];
  numeric: string;
  numerator: string;
  denominator: string;
  sentence: string;
}

interface Fmt { format?: string; numeric?: { format?: string } }

export function numericFormat(q: ClientQuestion): 'integer' | 'decimal' | 'fraction' | null {
  const c = q.content as unknown as Fmt;
  if (q.type === 'NE') return (c.format as 'integer' | 'decimal' | 'fraction') ?? 'decimal';
  if (q.type === 'DI' && c.format === 'numeric_entry') return (c.numeric?.format as 'integer' | 'decimal' | 'fraction') ?? 'decimal';
  return null;
}

export function formatOf(q: ClientQuestion): string | undefined {
  return (q.content as unknown as Fmt).format;
}

export function blankCount(q: ClientQuestion): number {
  return q.type === 'TC' ? (q.content as TCContent).blanks.length : 0;
}

export const emptySelection = (q: ClientQuestion): Selection => ({
  ids: [],
  blanks: Array(blankCount(q)).fill(null),
  numeric: '',
  numerator: '',
  denominator: '',
  sentence: '',
});

const NUM = /^-?(\d+\.?\d*|\.\d+)$/;
const INT = /^-?\d+$/;

export function parseNumeric(q: ClientQuestion, s: Selection): { value: number | null; numerator?: number; denominator?: number } {
  const f = numericFormat(q);
  if (f === 'fraction') {
    const n = s.numerator.trim(), d = s.denominator.trim();
    if (!INT.test(n) || !INT.test(d) || Number(d) === 0) return { value: null };
    return { value: Number(n) / Number(d), numerator: Number(n), denominator: Number(d) };
  }
  const t = s.numeric.trim();
  return { value: NUM.test(t) ? Number(t) : null };
}

export function toResponse(q: ClientQuestion, s: Selection): Response {
  if (q.type === 'TC') return { kind: 'blanks', ids: s.blanks };
  if (numericFormat(q)) return { kind: 'numeric', ...parseNumeric(q, s) };
  if (q.type === 'RC' && formatOf(q) === 'select_in_passage') return { kind: 'sentence', sentence: s.sentence };
  return { kind: 'choices', ids: s.ids };
}

export function hasAnswer(q: ClientQuestion, s: Selection): boolean {
  if (q.type === 'TC') return s.blanks.length > 0 && s.blanks.every(Boolean);
  if (q.type === 'SE') return s.ids.length === 2;
  if (numericFormat(q)) return parseNumeric(q, s).value !== null;
  if (q.type === 'RC' && formatOf(q) === 'select_in_passage') return s.sentence !== '';
  return s.ids.length > 0;
}

/** True when a click on another choice replaces the current one. */
export function isSingle(q: ClientQuestion): boolean {
  if (q.type === 'SE') return false;
  if (q.type === 'QC') return true;
  return formatOf(q) !== 'select_all';
}

export function choicesOf(q: ClientQuestion): Choice[] {
  if (q.type === 'QC') return [...QC_CHOICES];
  const c = q.content as { choices?: Choice[] };
  return c.choices ?? [];
}

export const ROMAN = ['i', 'ii', 'iii'];
