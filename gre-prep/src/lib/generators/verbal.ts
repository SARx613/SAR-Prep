/* Verbal generators.
 *
 * Unlike the quant templates, verbal items are not parametric: the answer
 * to a Text Completion depends on the meaning of the whole sentence, which
 * cannot be drawn from a random number. What varies here is which frame is
 * used and how the choices are ordered, so the same frame does not always
 * present the key in the same position.
 *
 * Per the ETS specification: a single-blank TC offers five choices, a
 * multi-blank TC offers three per blank, and SE offers six choices of which
 * exactly two are credited. No partial credit in either case.
 */

import type {
  Choice,
  Difficulty,
  SEAnswer,
  SEContent,
  TCAnswer,
  TCBlank,
  TCContent,
} from '@/types/questions';
import { LETTERS } from './format';
import type { Rng } from './rng';
import type { GeneratedQuestion } from './types';
import { SE_FRAMES, TC_FRAMES, type SEFrame, type TCFrame } from './verbal-data';

/* Extra options used to pad a single-blank TC out to five choices. The GRE
 * gives five choices when there is one blank, but a frame only carries two
 * distractors, so we top up with words that are wrong in any of these
 * frames — abstract, register-appropriate, and semantically unrelated. */
const FILLER = [
  'tangential',
  'provisional',
  'ubiquitous',
  'nominal',
  'reciprocal',
  'antecedent',
  'incidental',
  'variegated',
  'peremptory',
  'quotidian',
  'ancillary',
  'diffuse',
];

export function buildTC(rng: Rng, frame: TCFrame): GeneratedQuestion {
  const singleBlank = frame.blanks.length === 1;

  const blanks: TCBlank[] = frame.blanks.map((b, i) => {
    let words = [b.correct, ...b.distractors];

    // One blank → five choices; two or three blanks → three per blank.
    if (singleBlank) {
      const pad = rng
        .sample(
          FILLER.filter((w) => !words.includes(w)),
          5 - words.length
        )
        .slice(0, 5 - words.length);
      words = [...words, ...pad];
    }

    const ordered = rng.shuffle(words);
    return {
      index: i + 1,
      choices: ordered.map((text, j) => ({
        // Multi-blank ids are prefixed by blank number, per the schema.
        id: singleBlank ? LETTERS[j] : `${i + 1}${LETTERS[j]}`,
        text,
      })),
    };
  });

  const answer: TCAnswer = {
    blanks: frame.blanks.map((b, i) => {
      const choice = blanks[i].choices.find((c) => c.text === b.correct);
      if (!choice) throw new Error(`TC key missing for blank ${i + 1}`);
      return choice.id;
    }),
  };

  const content: TCContent = { text: frame.text, blanks };

  const stem =
    frame.blanks.length === 1
      ? 'Select the word that best completes the text.'
      : `Select one entry for each blank, choosing the set of words that best completes the text.`;

  return {
    type: 'TC',
    section: 'verbal',
    topic: 'text-completion',
    subtopic: frame.blanks.length === 1 ? 'single-blank' : `${frame.blanks.length}-blank`,
    difficulty: frame.difficulty,
    stem,
    content,
    answer,
    explanation:
      frame.rationale +
      ' Because Text Completion awards no partial credit, every blank must be right for the item to count.',
    tags: ['text-completion', ...frame.tags],
    template: 'verbal.tc',
  };
}

export function buildSE(rng: Rng, frame: SEFrame): GeneratedQuestion {
  const words = rng.shuffle([...frame.pair, ...frame.distractors]);
  const choices: Choice[] = words.map((text, i) => ({ id: LETTERS[i], text }));

  const ids = frame.pair.map((w) => {
    const c = choices.find((ch) => ch.text === w);
    if (!c) throw new Error('SE key missing');
    return c.id;
  });

  const content: SEContent = { text: frame.text, choices };
  const answer: SEAnswer = { choices: [ids[0], ids[1]] };

  return {
    type: 'SE',
    section: 'verbal',
    topic: 'sentence-equivalence',
    subtopic: 'synonym-pair',
    difficulty: frame.difficulty,
    stem:
      'Select the two answer choices that, when used to complete the sentence, fit the meaning of the sentence as a whole and produce completed sentences that are alike in meaning.',
    content,
    answer,
    explanation:
      frame.rationale +
      ' Both credited choices must produce sentences alike in meaning, so a word that fits the blank but has no partner among the choices cannot be part of the answer. There is no partial credit.',
    tags: ['sentence-equivalence', ...frame.tags],
    template: 'verbal.se',
  };
}

/** Every TC and SE item the frame set can produce, in one pass. */
export function buildAllVerbal(rng: Rng): GeneratedQuestion[] {
  return [
    ...TC_FRAMES.map((f) => buildTC(rng, f)),
    ...SE_FRAMES.map((f) => buildSE(rng, f)),
  ];
}

export { TC_FRAMES, SE_FRAMES };
export type { Difficulty };
