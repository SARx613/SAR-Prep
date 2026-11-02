/* Grading for the full-length tests.
 *
 * Pure functions, no database and no React — the server action feeds them
 * the key and the user's responses. As on the real exam there is no partial
 * credit: a multi-part answer is right only when every part is, and an
 * unanswered question simply scores nothing.
 */

import { isWriting } from '@/types/official';
import type {
  Answer,
  ExamContent,
  ExamResponses,
  ExamResult,
  Expected,
  Img,
  ItemResult,
  QuantItem,
  SampleEssay,
  SectionResult,
  VerbalItem,
} from '@/types/official';

export type KeyAnswer =
  | { blanks: string[] }
  | { choices: string[] }
  | { choice: string }
  | { sentence: number }
  | { value: number }
  | { fraction: [number, number] };

export interface KeyEntry {
  answer: KeyAnswer;
  p: number;
  explanation: string[] | Img | null;
}

export interface ExamKey {
  sections: Record<string, Record<string, KeyEntry> | { samples: SampleEssay[] }>;
  conversion: { verbal: Record<string, number>; quant: Record<string, number> };
}

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

/** Reads "12", "-3.5", "1,000" or "3/4"; null when it is not a number. */
export function parseNumber(raw: string | undefined): number | null {
  const t = (raw ?? '').trim().replace(/,/g, '').replace(/\s+/g, '').replace(/[−–]/g, '-');
  if (!t) return null;
  const frac = t.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/);
  if (frac) {
    const d = Number(frac[2]);
    return d === 0 ? null : Number(frac[1]) / d;
  }
  return /^-?(\d+\.?\d*|\.\d+)$/.test(t) ? Number(t) : null;
}

export function countWords(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function expectedOf(key: KeyAnswer): Expected {
  if ('blanks' in key) return { kind: 'blanks', ids: key.blanks };
  if ('choices' in key) return { kind: 'ids', ids: key.choices };
  if ('choice' in key) return { kind: 'ids', ids: [key.choice] };
  if ('sentence' in key) return { kind: 'sentence', n: key.sentence };
  if ('value' in key) return { kind: 'value', value: key.value };
  return { kind: 'fraction', num: key.fraction[0], den: key.fraction[1] };
}

/** A question counts as answered once anything has been entered. */
function isAnswered(a: Answer | undefined): boolean {
  if (!a) return false;
  if (a.ids?.length) return true;
  if (a.blanks?.some(Boolean)) return true;
  if (a.sentence) return true;
  return Boolean(a.text?.trim() || a.num?.trim() || a.den?.trim());
}

export function gradeItem(
  item: VerbalItem | QuantItem,
  key: KeyAnswer,
  answer: Answer | undefined,
): boolean {
  if (!isAnswered(answer)) return false;
  const a = answer as Answer;

  if ('blanks' in key) {
    const picked = a.blanks ?? [];
    return picked.length === key.blanks.length && key.blanks.every((k, i) => picked[i] === k);
  }
  if ('sentence' in key) return a.sentence === key.sentence;
  if ('choice' in key) return a.ids?.[0] === key.choice;
  if ('choices' in key) return sameSet(a.ids ?? [], key.choices);

  if ('value' in key) {
    const v = parseNumber(a.text);
    return v !== null && Math.abs(v - key.value) < 1e-9;
  }
  // Fraction: any equivalent pair of integers is accepted.
  const n = parseNumber(a.num);
  const d = parseNumber(a.den);
  if (n === null || d === null || d === 0 || !Number.isInteger(n) || !Number.isInteger(d)) return false;
  return n * key.fraction[1] === key.fraction[0] * d;
}

export function gradeExam(
  content: ExamContent,
  key: ExamKey,
  responses: ExamResponses,
  timeMs: Record<string, Record<number, number>> = {},
): Omit<ExamResult, 'examId' | 'completedAt' | 'saved'> {
  const sections: Record<string, SectionResult> = {};
  const tally = { verbal: { raw: 0, total: 0 }, quant: { raw: 0, total: 0 } };

  for (const section of content.sections) {
    const sectionKey = key.sections[section.id];
    const given = responses[section.id];

    if (isWriting(section)) {
      const text = given?.essay ?? '';
      sections[section.id] = {
        id: section.id,
        kind: section.kind,
        essay: { text, words: countWords(text) },
        samples: (sectionKey as { samples: SampleEssay[] }).samples,
      };
      continue;
    }

    const entries = sectionKey as Record<string, KeyEntry>;
    const items: ItemResult[] = section.items.map((item) => {
      const entry = entries[String(item.n)];
      const answer = given?.answers?.[item.n];
      return {
        n: item.n,
        correct: gradeItem(item, entry.answer, answer),
        skipped: !isAnswered(answer),
        expected: expectedOf(entry.answer),
        p: entry.p,
        explanation: entry.explanation,
        timeMs: timeMs[section.id]?.[item.n],
      };
    });
    const correct = items.filter((i) => i.correct).length;
    sections[section.id] = { id: section.id, kind: section.kind, correct, total: items.length, items };
    const bucket = section.kind === 'verbal' ? tally.verbal : tally.quant;
    bucket.raw += correct;
    bucket.total += items.length;
  }

  return {
    verbal: { ...tally.verbal, scaled: key.conversion.verbal[String(tally.verbal.raw)] ?? 130 },
    quant: { ...tally.quant, scaled: key.conversion.quant[String(tally.quant.raw)] ?? 130 },
    sections,
  };
}
