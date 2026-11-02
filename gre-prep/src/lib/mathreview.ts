/* The exercises of the ETS "GRE Math Review", typed as text (formulas in
 * KaTeX). Private study material: loaded from gre-prep/private/ by
 * mathreview-data.ts, never shipped. An exercise's figure, when it has
 * one, is cropped from the book. The explanations live in the Learn course —
 * each part links to its chapter. */

export interface ExerciseImage {
  src: string;
  w: number;
  h: number;
}

export interface MathExercise {
  n: number;
  /** Statement and answer as typed text (see RichText for the syntax). */
  q: string;
  a: string;
  figure?: ExerciseImage;
}

export type PartId = 'arithmetic' | 'algebra' | 'geometry' | 'data-analysis';

export interface MathPart {
  id: PartId;
  exercises: MathExercise[];
}

export const PART_LABEL: Record<PartId, string> = {
  arithmetic: 'Arithmetic',
  algebra: 'Algebra',
  geometry: 'Geometry',
  'data-analysis': 'Data Analysis',
};

/** Learn chapter that teaches each part. */
export const PART_CHAPTER: Record<PartId, string> = {
  arithmetic: 'q1',
  algebra: 'q2',
  geometry: 'q3',
  'data-analysis': 'q4',
};
