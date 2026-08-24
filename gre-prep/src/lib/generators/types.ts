import type {
  Choice,
  Difficulty,
  FigureData,
  FigureKind,
  QuestionAnswer,
  QuestionContent,
  QuestionType,
  Section,
} from '@/types/questions';
import type { Rng } from './rng';

/** A generated item, before it is written to the database. */
export interface GeneratedQuestion {
  type: QuestionType;
  section: Section;
  topic: string;
  subtopic?: string;
  difficulty: Difficulty;
  stem: string;
  content: QuestionContent;
  answer: QuestionAnswer;
  explanation: string;
  tags: string[];
  /** Set when the item needs a figure; the writer creates and links it. */
  figure?: { kind: FigureKind; title?: string; data: FigureData; notes?: string };
  /** Template id, so a faulty item traces back to its generator. */
  template: string;
}

/**
 * A parametric item template. `build` must be pure given `rng`: same seed,
 * same item. Templates own their own difficulty range because a template
 * that only makes easy items should not be asked for a hard one.
 *
 * `build` returns null when the drawn parameters produce a degenerate item
 * (a negative quantity, a collision between key and distractor); the caller
 * simply redraws.
 */
export interface Template {
  id: string;
  type: QuestionType;
  topic: string;
  subtopic?: string;
  difficulties: Difficulty[];
  build: (rng: Rng, difficulty: Difficulty) => GeneratedQuestion | null;
}

/** Shape shared by every numeric select-one item, before choices are built. */
export interface NumericDraft {
  correct: number;
  distractors: number[];
  format?: (n: number) => string;
}

export type { Choice };
