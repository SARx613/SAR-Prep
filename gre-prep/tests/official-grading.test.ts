import { describe, expect, it } from 'vitest';
import { gradeExam, parseNumber, type ExamKey, type KeyAnswer } from '@/lib/official-grading';
import type { Answer, ExamContent, ExamResponses } from '@/types/official';
import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'private', 'official-tests');
const load = (f: string): unknown => {
  try {
    return JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8'));
  } catch {
    return null;
  }
};
const test1 = load('test-1.json');
const key1 = load('test-1.key.json');
const test2 = load('test-2.json');
const key2 = load('test-2.key.json');
const present = Boolean(test1 && key1 && test2 && key2);

/* The two official tests (private study material: skipped when absent, as on CI) are graded against ETS's key. A perfect answer sheet
 * built from the key must score 50/50 on both measures (170), a blank sheet 0
 * (130); fractions are accepted in any equivalent form. */

function perfect(content: ExamContent, key: ExamKey): ExamResponses {
  const out: ExamResponses = {};
  for (const s of content.sections) {
    if (!('items' in s)) {
      out[s.id] = { answers: {}, essay: 'x' };
      continue;
    }
    const answers: Record<number, Answer> = {};
    for (const it of s.items) {
      const k = (key.sections[s.id] as Record<string, { answer: KeyAnswer }>)[String(it.n)].answer;
      if ('blanks' in k) answers[it.n] = { blanks: k.blanks };
      else if ('choices' in k) answers[it.n] = { ids: k.choices };
      else if ('choice' in k) answers[it.n] = { ids: [k.choice] };
      else if ('sentence' in k) answers[it.n] = { sentence: k.sentence };
      else if ('value' in k) answers[it.n] = { text: String(k.value) };
      else answers[it.n] = { num: String(k.fraction[0] * 2), den: String(k.fraction[1] * 2) }; // equivalent fraction
    }
    out[s.id] = { answers };
  }
  return out;
}

describe.skipIf(!present).each([
  ['test 1', test1, key1],
  ['test 2', test2, key2],
])('official %s', (_name, c, k) => {
  const content = c as unknown as ExamContent;
  const key = k as unknown as ExamKey;

  it('has 4 graded sections of 25 questions', () => {
    const graded = content.sections.filter((s) => 'items' in s);
    expect(graded).toHaveLength(4);
    for (const s of graded) expect('items' in s && s.items).toHaveLength(25);
  });

  it('scores a perfect sheet 50/50 → 170 on both measures', () => {
    const r = gradeExam(content, key, perfect(content, key));
    expect(r.verbal).toMatchObject({ raw: 50, total: 50, scaled: 170 });
    expect(r.quant).toMatchObject({ raw: 50, total: 50, scaled: 170 });
  });

  it('scores a blank sheet 0 → 130', () => {
    const r = gradeExam(content, key, {});
    expect(r.verbal).toMatchObject({ raw: 0, scaled: 130 });
    expect(r.quant).toMatchObject({ raw: 0, scaled: 130 });
  });
});

describe('parseNumber', () => {
  it('reads integers, decimals, thousands separators and fractions', () => {
    expect(parseNumber('1,000')).toBe(1000);
    expect(parseNumber(' -3.5 ')).toBe(-3.5);
    expect(parseNumber('3/4')).toBe(0.75);
    expect(parseNumber('abc')).toBeNull();
    expect(parseNumber('1/0')).toBeNull();
  });
});
