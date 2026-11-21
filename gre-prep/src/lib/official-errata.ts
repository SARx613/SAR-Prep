import type { Answer } from '@/types/official';

/* Corrections to the official tests after people had already taken them.
 *
 * When a question was shown wrongly (for example with Quantity A and Quantity B
 * in the wrong order), an answer given before the fix meant something else
 * than the same letter means now. Each erratum says how to translate those old
 * answers into the corrected question, so that stored results can be rescored
 * fairly instead of counting a sound answer as wrong. */

export interface Erratum {
  id: string;
  examId: string;
  section: string;
  n: number;
  /** Old choice id → the choice id with the same meaning in the corrected question. */
  remap: Record<string, string>;
  /** Answers saved before this moment (ISO time) were given on the old version. */
  fixedAt: string;
}

export const ERRATA: readonly Erratum[] = [
  {
    // Quantity A and Quantity B were swapped on screen; the key (A) follows the book.
    id: 'test-1-s6-q3-quantities-swapped',
    examId: 'test-1',
    section: 's6',
    n: 3,
    remap: { A: 'B', B: 'A' },
    fixedAt: '2026-11-21T22:55:00Z',
  },
];

/** Errata that apply to a run started at `startedAt` and not yet applied to it. */
export function pendingErrata(examId: string, startedAt: number, applied: readonly string[] = []): Erratum[] {
  return ERRATA.filter((e) => e.examId === examId && startedAt < Date.parse(e.fixedAt) && !applied.includes(e.id));
}

/** The answers with each erratum's old choice ids translated; untouched when nothing applies. */
export function remapAnswers(
  answers: Record<string, Record<number, Answer>>,
  errata: readonly Erratum[],
): Record<string, Record<number, Answer>> {
  let out = answers;
  for (const e of errata) {
    const a = out[e.section]?.[e.n];
    if (!a?.ids?.length) continue;
    const ids = a.ids.map((id) => e.remap[id] ?? id);
    out = { ...out, [e.section]: { ...out[e.section], [e.n]: { ...a, ids } } };
  }
  return out;
}
