/* Turns a numeric draft into a finished select-one item.
 *
 * Numeric quant items all share the same last mile: shuffle the key in with
 * its distractors, letter them, and record which letter won. Doing it here
 * keeps every template honest about producing a real answer key.
 */

import type { Difficulty, PSContent, ChoiceAnswer } from '@/types/questions';
import { buildChoices } from './format';
import type { Rng } from './rng';
import type { GeneratedQuestion, NumericDraft } from './types';

export interface NumericItemSpec {
  type: 'PS' | 'DI';
  topic: string;
  subtopic?: string;
  difficulty: Difficulty;
  stem: string;
  explanation: string;
  tags: string[];
  template: string;
  numeric: NumericDraft;
  figure?: GeneratedQuestion['figure'];
}

export function numericItem(
  rng: Rng,
  spec: NumericItemSpec
): GeneratedQuestion | null {
  const { choices, correctId } = buildChoices(
    rng,
    spec.numeric.correct,
    spec.numeric.distractors,
    { format: spec.numeric.format }
  );
  if (choices.length < 5) return null;

  const content: PSContent = { format: 'select_one', choices };
  const answer: ChoiceAnswer = { choices: [correctId] };

  return {
    type: spec.type,
    section: 'quant',
    topic: spec.topic,
    subtopic: spec.subtopic,
    difficulty: spec.difficulty,
    stem: spec.stem,
    content,
    answer,
    explanation: spec.explanation,
    tags: spec.tags,
    template: spec.template,
    figure: spec.figure,
  };
}
