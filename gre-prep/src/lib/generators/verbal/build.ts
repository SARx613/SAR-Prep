/* Builds verbal questions from frames.
 *
 * Verbal items are not parametric the way quant items are — the answer to a
 * Text Completion depends on the meaning of the whole sentence and cannot
 * be drawn from a random number. What the RNG varies is the ORDER of the
 * choices, so the same frame does not always present its key in the same
 * position.
 */

import type {
  ChoiceAnswer,
  Choice,
  InPassageAnswer,
  RCContent,
  SEAnswer,
  SEContent,
  TCAnswer,
  TCBlank,
  TCContent,
} from '@/types/questions';
import { LETTERS } from '../format';
import { DECK_WORDS } from './deck-words';
import { resolveOrdinals } from './explain';
import type { Rng } from '../rng';
import type { GeneratedQuestion } from '../types';
import type { PassageSpec } from './rc-types';
import type { SEFrame, TCFrame } from './taxonomy';

/**
 * Tags naming the flashcard words an item uses.
 *
 * These let the app connect practice back to the deck: a missed question can
 * point at the cards it drew on, and a session can be filtered to words the
 * user is still learning. `vocab:` marks any deck word among the choices;
 * `key-vocab:` marks one that is part of the credited answer.
 */
function vocabTags(choices: string[], keys: string[]): string[] {
  const tags: string[] = [];
  const keySet = new Set(keys.map((w) => w.toLowerCase()));
  for (const raw of new Set(choices.map((w) => w.toLowerCase()))) {
    if (!DECK_WORDS.has(raw)) continue;
    tags.push(`vocab:${raw}`);
    if (keySet.has(raw)) tags.push(`key-vocab:${raw}`);
  }
  return tags;
}

export function buildTC(rng: Rng, frame: TCFrame): GeneratedQuestion {
  const count = frame.blanks.length;
  const single = count === 1;

  const blanks: TCBlank[] = frame.blanks.map((b, i) => {
    // ETS: five choices when there is one blank, three per blank otherwise.
    const want = single ? 5 : 3;
    const words = [b.correct, ...b.distractors].slice(0, want);
    const ordered = rng.shuffle(words);
    return {
      index: i + 1,
      choices: ordered.map((text, j) => ({
        // Multi-blank ids are prefixed by blank number so they stay unique
        // across the item.
        id: single ? LETTERS[j] : `${i + 1}${LETTERS[j]}`,
        text,
      })),
    };
  });

  const answer: TCAnswer = {
    blanks: frame.blanks.map((b, i) => {
      const c = blanks[i].choices.find((ch) => ch.text === b.correct);
      if (!c) throw new Error(`TC key "${b.correct}" missing from blank ${i + 1}`);
      return c.id;
    }),
  };

  const content: TCContent = { text: frame.text, blanks };

  return {
    type: 'TC',
    section: 'verbal',
    topic: 'text-completion',
    subtopic: `tc-${count}-blank`,
    difficulty: frame.difficulty,
    stem: single
      ? 'Select the word that best completes the text.'
      : 'Select one entry for each blank, choosing the set of words that best completes the text.',
    content,
    answer,
    explanation:
      frame.rationale +
      ' Text Completion awards no partial credit, so every blank must be right for the item to count.',
    tags: [
      'text-completion',
      `tc-${count}-blank`,
      ...frame.tags,
      ...vocabTags(
        frame.blanks.flatMap((b) => [b.correct, ...b.distractors]),
        frame.blanks.map((b) => b.correct)
      ),
    ],
    template: `verbal.tc.${count}`,
  };
}

export function buildSE(rng: Rng, frame: SEFrame): GeneratedQuestion {
  const words = rng.shuffle([...frame.pair, ...frame.distractors]);
  const choices: Choice[] = words.map((text, i) => ({ id: LETTERS[i], text }));

  const ids = frame.pair.map((w) => {
    const c = choices.find((ch) => ch.text === w);
    if (!c) throw new Error(`SE key "${w}" missing from choices`);
    return c.id;
  });

  const content: SEContent = { text: frame.text, choices };
  const answer: SEAnswer = { choices: [ids[0], ids[1]] };

  return {
    type: 'SE',
    section: 'verbal',
    topic: 'sentence-equivalence',
    subtopic: 'sentence-equivalence',
    difficulty: frame.difficulty,
    stem: 'Select the two answer choices that, when used to complete the sentence, fit the meaning of the sentence as a whole and produce completed sentences that are alike in meaning.',
    content,
    answer,
    explanation:
      frame.rationale +
      ' Both credited choices must produce sentences alike in meaning, so a word that fits the blank but has no partner among the choices cannot be part of the answer. There is no partial credit.',
    tags: [
      'sentence-equivalence',
      ...frame.tags,
      ...vocabTags([...frame.pair, ...frame.distractors], [...frame.pair]),
    ],
    template: 'verbal.se',
  };
}

export interface BuiltPassage {
  spec: PassageSpec;
  questions: GeneratedQuestion[];
}

export function buildRC(rng: Rng, spec: PassageSpec): BuiltPassage {
  const questions = spec.questions.map((q): GeneratedQuestion => {
    const base = {
      type: 'RC' as const,
      section: 'verbal' as const,
      topic: 'reading-comprehension',
      subtopic: q.category,
      difficulty: q.difficulty,
      stem: q.stem,
      explanation: q.explanation,
      tags: ['reading-comprehension', q.category, ...(q.tags ?? [])],
      template: `verbal.rc.${q.category}`,
    };

    if (q.format === 'select_in_passage') {
      if (!q.sentence) throw new Error(`select_in_passage without sentence: ${q.stem}`);
      // The target must actually occur in the passage, or the item is
      // unanswerable however good the reasoning.
      if (!spec.body.includes(q.sentence)) {
        throw new Error(`select_in_passage target not found in "${spec.title}"`);
      }
      const content: RCContent = {
        format: 'select_in_passage',
        paragraphIndex: q.paragraphIndex,
      };
      const answer: InPassageAnswer = { sentence: q.sentence };
      return { ...base, content, answer };
    }

    if (!q.choices?.length) throw new Error(`RC question without choices: ${q.stem}`);
    const texts = rng.shuffle(q.choices);
    const choices: Choice[] = texts.map((text, i) => ({ id: LETTERS[i], text }));

    // The explanation was written against the authored order, so map each
    // authored position to the id its choice ended up with and rewrite the
    // ordinals — otherwise "the third choice" points at the wrong option.
    const order = q.choices.map((t) => choices.find((c) => c.text === t)!.id);

    // Convention: for select_one the key is the first entry as authored;
    // for select_all the credited subset is listed explicitly.
    const keyTexts = q.correctTexts ?? [q.choices[0]];
    const ids = keyTexts.map((t) => {
      const c = choices.find((ch) => ch.text === t);
      if (!c) throw new Error(`RC key not among choices: ${t.slice(0, 50)}`);
      return c.id;
    });

    const content: RCContent = { format: q.format, choices };
    const answer: ChoiceAnswer = { choices: ids };
    return { ...base, content, answer, explanation: resolveOrdinals(q.explanation, order) };
  });

  return { spec, questions };
}
