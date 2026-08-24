/* Bank generation: draw items from every template, validate them, and drop
 * duplicates.
 *
 * Validation matters more than volume here. A generated bank can silently
 * produce items with no correct answer, or with a distractor equal to the
 * key, and a practice tool that marks a right answer wrong is worse than
 * no tool at all. Every item is checked against its own answer key before
 * it is allowed into the bank.
 */

import type { Difficulty } from '@/types/questions';
import { arithmeticTemplates } from './arithmetic';
import { algebraTemplates } from './algebra';
import { dataTemplates } from './data';
import { geometryTemplates } from './geometry';
import { Rng, hashSeed } from './rng';
import type { GeneratedQuestion, Template } from './types';
import { ALL_PASSAGES, buildReading, buildShortVerbal } from './verbal/index';

export const QUANT_TEMPLATES: Template[] = [
  ...arithmeticTemplates,
  ...algebraTemplates,
  ...geometryTemplates,
  ...dataTemplates,
];

/* ── Validation ───────────────────────────────────────────────────────── */

export function validate(q: GeneratedQuestion): string[] {
  const errors: string[] = [];
  const c = q.content as unknown as Record<string, unknown>;
  const a = q.answer as unknown as Record<string, unknown>;

  if (!q.stem?.trim()) errors.push('empty stem');
  if (!q.explanation?.trim()) errors.push('empty explanation');
  if (q.difficulty < 1 || q.difficulty > 5) errors.push('difficulty out of range');

  const choiceList = (c.choices ?? []) as { id: string; text: string }[];

  switch (q.type) {
    case 'TC': {
      const blanks = (c.blanks ?? []) as {
        index: number;
        choices: { id: string; text: string }[];
      }[];
      const keys = (a.blanks ?? []) as string[];
      if (blanks.length === 0) errors.push('TC has no blanks');
      if (keys.length !== blanks.length) errors.push('TC key count mismatch');
      blanks.forEach((b, i) => {
        const expected = blanks.length === 1 ? 5 : 3;
        if (b.choices.length !== expected)
          errors.push(`TC blank ${i + 1} has ${b.choices.length} choices, expected ${expected}`);
        if (!b.choices.some((ch) => ch.id === keys[i]))
          errors.push(`TC blank ${i + 1} key not among its choices`);
        const texts = new Set(b.choices.map((ch) => ch.text));
        if (texts.size !== b.choices.length)
          errors.push(`TC blank ${i + 1} has duplicate choices`);
      });
      // Every blank must have a marker in the text.
      blanks.forEach((_, i) => {
        if (!(c.text as string).includes(`{{${i + 1}}}`))
          errors.push(`TC text missing marker {{${i + 1}}}`);
      });
      break;
    }

    case 'SE': {
      const keys = (a.choices ?? []) as string[];
      if (choiceList.length !== 6) errors.push(`SE has ${choiceList.length} choices, expected 6`);
      if (keys.length !== 2) errors.push('SE must credit exactly two choices');
      if (new Set(keys).size !== keys.length) errors.push('SE keys duplicated');
      keys.forEach((k) => {
        if (!choiceList.some((ch) => ch.id === k)) errors.push(`SE key ${k} not among choices`);
      });
      if (new Set(choiceList.map((ch) => ch.text)).size !== choiceList.length)
        errors.push('SE has duplicate choices');
      if (!(c.text as string)?.includes('{{1}}')) errors.push('SE text missing marker');
      break;
    }

    case 'QC': {
      const choice = a.choice as string;
      if (!['A', 'B', 'C', 'D'].includes(choice)) errors.push(`QC answer ${choice} invalid`);
      if (!c.quantityA || !c.quantityB) errors.push('QC missing a quantity');
      break;
    }

    case 'NE': {
      const v = a.value as number;
      if (typeof v !== 'number' || !Number.isFinite(v)) errors.push('NE value not finite');
      break;
    }

    case 'RC':
    case 'PS':
    case 'DI': {
      const format = c.format as string;
      if (format === 'select_in_passage') {
        if (!(a.sentence as string)?.trim()) errors.push('select-in-passage missing sentence');
        break;
      }
      const keys = (a.choices ?? []) as string[];
      if (choiceList.length < 3) errors.push(`only ${choiceList.length} choices`);
      if (keys.length === 0) errors.push('no correct answer recorded');
      keys.forEach((k) => {
        if (!choiceList.some((ch) => ch.id === k)) errors.push(`key ${k} not among choices`);
      });
      if (new Set(choiceList.map((ch) => ch.text)).size !== choiceList.length)
        errors.push('duplicate choice text');
      if (format === 'select_one' && keys.length !== 1)
        errors.push('select_one must credit exactly one choice');
      break;
    }
  }

  return errors;
}

/** Identity of an item, for deduplication across draws. */
function fingerprint(q: GeneratedQuestion): string {
  const c = q.content as unknown as Record<string, unknown>;
  const parts = [q.type, q.stem, (c.text as string) ?? '', (c.quantityA as string) ?? '', (c.quantityB as string) ?? ''];
  const choices = (c.choices ?? []) as { text: string }[];
  parts.push(choices.map((ch) => ch.text).sort().join('|'));
  return parts.join('§');
}

export interface BankOptions {
  /** Items to attempt per (template × difficulty). */
  perTemplateDifficulty?: number;
  seed?: number;
}

export interface Bank {
  questions: GeneratedQuestion[];
  passages: { spec: (typeof ALL_PASSAGES)[number]; questions: GeneratedQuestion[] }[];
  stats: {
    generated: number;
    rejected: number;
    duplicates: number;
    byType: Record<string, number>;
    bySection: Record<string, number>;
    byDifficulty: Record<number, number>;
  };
}

export function generateBank(options: BankOptions = {}): Bank {
  const perCell = options.perTemplateDifficulty ?? 6;
  const seed = options.seed ?? 20260824;

  const questions: GeneratedQuestion[] = [];
  const seen = new Set<string>();
  let rejected = 0;
  let duplicates = 0;

  const record = (q: GeneratedQuestion): boolean => {
    const errs = validate(q);
    if (errs.length) {
      rejected++;
      if (process.env.GRE_DEBUG) {
        console.warn(`  reject [${q.template}] ${errs.join('; ')}`);
      }
      return false;
    }
    const fp = fingerprint(q);
    if (seen.has(fp)) {
      duplicates++;
      return false;
    }
    seen.add(fp);
    questions.push(q);
    return true;
  };

  // Quant: every template, at each difficulty it declares, `perCell` times.
  for (const tpl of QUANT_TEMPLATES) {
    for (const difficulty of tpl.difficulties) {
      for (let i = 0; i < perCell; i++) {
        const rng = new Rng(hashSeed(`${seed}:${tpl.id}:${difficulty}:${i}`));
        // A template may reject its own parameters; retry a few times.
        for (let attempt = 0; attempt < 8; attempt++) {
          const item = tpl.build(rng, difficulty as Difficulty);
          if (item && record(item)) break;
          if (!item) continue;
        }
      }
    }
  }

  // Verbal: frames are fixed content, so each yields exactly one item.
  // Only the order of the choices varies with the seed.
  const verbalRng = new Rng(hashSeed(`${seed}:verbal`));
  for (const q of buildShortVerbal(verbalRng)) record(q);

  // Reading: passages carry their own question sets.
  const readingRng = new Rng(hashSeed(`${seed}:rc`));
  const passages = buildReading(readingRng).map(({ spec, questions: qs }) => {
    const kept = qs.filter((q) => {
      const errs = validate(q);
      if (errs.length) {
        rejected++;
        if (process.env.GRE_DEBUG) console.warn(`  reject [rc] ${errs.join('; ')}`);
        return false;
      }
      return true;
    });
    return { spec, questions: kept };
  });

  const byType: Record<string, number> = {};
  const bySection: Record<string, number> = {};
  const byDifficulty: Record<number, number> = {};
  const all = [...questions, ...passages.flatMap((p) => p.questions)];
  for (const q of all) {
    byType[q.type] = (byType[q.type] ?? 0) + 1;
    bySection[q.section] = (bySection[q.section] ?? 0) + 1;
    byDifficulty[q.difficulty] = (byDifficulty[q.difficulty] ?? 0) + 1;
  }

  return {
    questions,
    passages,
    stats: {
      generated: all.length,
      rejected,
      duplicates,
      byType,
      bySection,
      byDifficulty,
    },
  };
}
