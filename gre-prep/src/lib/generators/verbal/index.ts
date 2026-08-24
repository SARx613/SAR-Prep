/* Verbal bank: all frames and passages, and the builders that turn them
 * into questions. */

import type { Rng } from '../rng';
import type { GeneratedQuestion } from '../types';
import { buildRC, buildSE, buildTC, type BuiltPassage } from './build';
import { PASSAGES_1 } from './rc-passages-1';
import { PASSAGES_2 } from './rc-passages-2';
import { PASSAGES_3 } from './rc-passages-3';
import { PASSAGES_4 } from './rc-passages-4';
import { SE_FRAMES } from './se-frames';
import { TC_1_BLANK, TC_2_BLANK, TC_3_BLANK } from './tc-frames';
import { TC_1_BLANK_2 } from './tc-frames-2';
import type { PassageSpec } from './rc-types';
import type { SEFrame, TCFrame } from './taxonomy';

export const ALL_TC: TCFrame[] = [
  ...TC_1_BLANK,
  ...TC_1_BLANK_2,
  ...TC_2_BLANK,
  ...TC_3_BLANK,
];

export const ALL_SE: SEFrame[] = SE_FRAMES;

export const ALL_PASSAGES: PassageSpec[] = [
  ...PASSAGES_1,
  ...PASSAGES_2,
  ...PASSAGES_3,
  ...PASSAGES_4,
];

/** Every short-verbal item (Text Completion and Sentence Equivalence). */
export function buildShortVerbal(rng: Rng): GeneratedQuestion[] {
  return [...ALL_TC.map((f) => buildTC(rng, f)), ...ALL_SE.map((f) => buildSE(rng, f))];
}

/** Every passage with its question set. */
export function buildReading(rng: Rng): BuiltPassage[] {
  return ALL_PASSAGES.map((spec) => buildRC(rng, spec));
}

export { buildRC, buildSE, buildTC };
export type { BuiltPassage, PassageSpec, SEFrame, TCFrame };
export * from './taxonomy';
