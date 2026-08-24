/* Answer grading.
 *
 * Kept free of React and of the database so the same rules run on the
 * client (instant feedback, offline) and on the server (recording an
 * attempt). The GRE awards no partial credit on any multi-response
 * question, so a partially right answer is simply wrong.
 */

import type {
  ChoiceAnswer,
  InPassageAnswer,
  NEAnswer,
  QCAnswer,
  Question,
  QuestionAnswer,
  SEAnswer,
  TCAnswer,
} from '@/types/questions';

/** What the user produced, by question type. */
export type Response =
  | { kind: 'choices'; ids: string[] }
  /** One entry per blank, ordered by blank index. */
  | { kind: 'blanks'; ids: (string | null)[] }
  | { kind: 'numeric'; value: number | null; numerator?: number; denominator?: number }
  | { kind: 'sentence'; sentence: string };

export interface Grade {
  isCorrect: boolean;
  /** Ids (or the sentence) that should have been chosen. */
  expected: string[];
  /** True when the user left the item incomplete. */
  incomplete: boolean;
}

const sameSet = (a: string[], b: string[]): boolean =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

export function grade(question: Question, response: Response): Grade {
  const answer = question.answer as QuestionAnswer;

  switch (question.type) {
    case 'TC': {
      const key = (answer as TCAnswer).blanks;
      if (response.kind !== 'blanks') return { isCorrect: false, expected: key, incomplete: true };
      const picked = response.ids;
      // Every blank must be filled and every blank must be right.
      const incomplete = picked.length !== key.length || picked.some((p) => !p);
      const isCorrect = !incomplete && key.every((k, i) => picked[i] === k);
      return { isCorrect, expected: key, incomplete };
    }

    case 'SE': {
      const key = (answer as SEAnswer).choices;
      if (response.kind !== 'choices') return { isCorrect: false, expected: [...key], incomplete: true };
      // Exactly two must be selected; one is incomplete, three is wrong.
      const incomplete = response.ids.length < 2;
      return {
        isCorrect: response.ids.length === 2 && sameSet(response.ids, [...key]),
        expected: [...key],
        incomplete,
      };
    }

    case 'QC': {
      const key = (answer as QCAnswer).choice;
      if (response.kind !== 'choices' || response.ids.length === 0)
        return { isCorrect: false, expected: [key], incomplete: true };
      return { isCorrect: response.ids[0] === key, expected: [key], incomplete: false };
    }

    case 'NE': {
      const key = answer as NEAnswer;
      if (response.kind !== 'numeric' || response.value === null)
        return { isCorrect: false, expected: [String(key.value)], incomplete: true };
      const tolerance = key.tolerance ?? 1e-6;
      return {
        isCorrect: Math.abs(response.value - key.value) <= tolerance,
        expected: [String(key.value)],
        incomplete: false,
      };
    }

    case 'RC':
    case 'PS':
    case 'DI': {
      const content = question.content as { format?: string };
      if (content.format === 'select_in_passage') {
        const key = (answer as InPassageAnswer).sentence;
        if (response.kind !== 'sentence')
          return { isCorrect: false, expected: [key], incomplete: true };
        const norm = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase();
        return {
          isCorrect: norm(response.sentence) === norm(key),
          expected: [key],
          incomplete: !response.sentence.trim(),
        };
      }

      const key = (answer as ChoiceAnswer).choices;
      if (response.kind !== 'choices')
        return { isCorrect: false, expected: key, incomplete: true };
      if (response.ids.length === 0)
        return { isCorrect: false, expected: key, incomplete: true };
      // select_all credits only an exact match — no partial credit.
      return { isCorrect: sameSet(response.ids, key), expected: key, incomplete: false };
    }

    default:
      return { isCorrect: false, expected: [], incomplete: true };
  }
}

/** How many responses an item expects, for enabling the submit button. */
export function requiredCount(question: Question): number {
  if (question.type === 'SE') return 2;
  if (question.type === 'TC') {
    const c = question.content as { blanks?: unknown[] };
    return c.blanks?.length ?? 1;
  }
  const c = question.content as { format?: string };
  if (c.format === 'select_all') return 1; // at least one
  return 1;
}

/** True when selecting another choice should replace the current one. */
export function isSingleSelect(question: Question): boolean {
  if (question.type === 'SE') return false;
  if (question.type === 'QC') return true;
  const c = question.content as { format?: string };
  return c.format !== 'select_all';
}

/** Maximum simultaneous selections, or null when unbounded. */
export function selectionCap(question: Question): number | null {
  if (question.type === 'SE') return 2;
  return isSingleSelect(question) ? 1 : null;
}
