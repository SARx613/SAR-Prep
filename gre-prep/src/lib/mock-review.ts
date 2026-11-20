/* Helpers to reconstruct frozen PlayerResult arrays for mock sections and history views. */

import { emptySelection, toResponse } from '@/components/exam/selection';
import type { PlayerResult } from '@/components/exam/ExamPlayer';
import type { ClientQuestion } from '@/content/types';
import type { Attempt } from './attempts';
import { grade as gradeQuestion } from './grading';
import type { SavedRunItem } from './run-history';

export function reconstructPartResults(
  questions: readonly ClientQuestion[],
  savedItems?: readonly SavedRunItem[],
  attempts?: readonly Attempt[],
): PlayerResult[] {
  const byQid = new Map<string, SavedRunItem>();
  for (const it of savedItems ?? []) byQid.set(it.qid, it);

  const latestAttempt = new Map<string, Attempt>();
  for (const a of attempts ?? []) {
    if (a.mode !== 'check') latestAttempt.set(a.qid, a);
  }

  return questions.map((q) => {
    const saved = byQid.get(q.id);
    if (saved) {
      return {
        q,
        sel: saved.sel,
        grade: gradeQuestion(q, toResponse(q, saved.sel)),
        ms: saved.ms,
      };
    }
    const att = latestAttempt.get(q.id);
    const sel = emptySelection(q);
    const expected = gradeQuestion(q, toResponse(q, sel)).expected;
    return {
      q,
      sel,
      grade: {
        isCorrect: att?.correct ?? false,
        expected,
        incomplete: !att,
      },
      ms: att?.ms ?? 0,
    };
  });
}
