/* Verbal taxonomy, matching the categories used to organise a GRE bank.
 *
 *   Short Verbal          Reading Comprehension
 *   ────────────          ─────────────────────
 *   TC 1 blank            Reasoning
 *   TC 2 blanks           Inference
 *   TC 3 blanks           Detail
 *   Sentence Equivalence  Global
 *                         Contextual Function
 *                         Other (vocabulary-in-context, select-in-passage)
 */

export type ShortVerbalKind =
  | 'tc-1-blank'
  | 'tc-2-blank'
  | 'tc-3-blank'
  | 'sentence-equivalence';

export type RCCategory =
  | 'reasoning'
  | 'inference'
  | 'detail'
  | 'global'
  | 'contextual-function'
  | 'other';

export const RC_CATEGORY_LABEL: Record<RCCategory, string> = {
  reasoning: 'Reasoning',
  inference: 'Inference',
  detail: 'Detail',
  global: 'Global',
  'contextual-function': 'Contextual Function',
  other: 'Other',
};

export type Difficulty = 1 | 2 | 3 | 4 | 5;

/** A Text Completion frame. Blanks are marked {{1}}, {{2}}, {{3}}. */
export interface TCFrame {
  text: string;
  /** Per blank: the key, then the distractors for that blank. */
  blanks: { correct: string; distractors: string[] }[];
  rationale: string;
  difficulty: Difficulty;
  tags: string[];
}

/**
 * A Sentence Equivalence frame.
 *
 * `pair` must be genuinely interchangeable in this sentence — SE credits
 * two choices that produce sentences alike in meaning, so a word that fits
 * the blank but has no partner cannot be part of the answer. The four
 * distractors must not themselves form a second synonymous pair, or the
 * item would have two valid answers; `checkVocab` enforces that.
 */
export interface SEFrame {
  text: string;
  pair: [string, string];
  distractors: [string, string, string, string];
  rationale: string;
  difficulty: Difficulty;
  tags: string[];
}
