import { describe, expect, it } from 'vitest';
import { checkContent, checkQuestion } from '@/content/check';
import { loadContent } from '@/content/load';
import { QuestionSchema, wordCount } from '@/content/schema';

const review = { status: 'draft' as const, solvedBy: [], sourceChecked: false };
const mk = (o: Record<string, unknown>) =>
  QuestionSchema.parse({
    id: 'x-1', lessonId: 'x', difficulty: 2, stem: 's', explanation: 'long enough explanation', estSeconds: 60, review, ...o,
  });
const none = new Map();

describe('content check — GRE format rules', () => {
  it('real content directory is valid', () => {
    const r = checkContent(loadContent());
    expect(r.errors).toEqual([]);
  });

  it('TC: 1 blank needs 5 choices, 2+ blanks need 3 each', () => {
    const c = (n: number) => Array.from({ length: n }, (_, i) => ({ id: 'ABCDE'[i], text: `w${i}` }));
    const one = mk({ type: 'TC', content: { text: 'a {{1}} b', blanks: [{ index: 1, choices: c(3) }] }, answer: { blanks: ['A'] } });
    expect(checkQuestion(one, none).join()).toMatch(/GRE has 5/);
    const ok = mk({ type: 'TC', content: { text: 'a {{1}} b', blanks: [{ index: 1, choices: c(5) }] }, answer: { blanks: ['A'] } });
    expect(checkQuestion(ok, none)).toEqual([]);
  });

  it('SE: six choices, two distinct keys', () => {
    const cs = Array.from({ length: 5 }, (_, i) => ({ id: 'ABCDE'[i], text: `w${i}` }));
    const bad = mk({ type: 'SE', content: { text: 'a {{1}} b', choices: cs }, answer: { choices: ['A', 'A'] } });
    const msgs = checkQuestion(bad, none).join();
    expect(msgs).toMatch(/6 choices/);
    expect(msgs).toMatch(/identical/);
  });

  it('RC: select-all has exactly 3 choices (ETS)', () => {
    const passages = new Map([['p', { id: 'p', field: 'everyday' as const, difficulty: 2 as const, paragraphs: ['A long enough paragraph of text here.'] }]]);
    const cs = ['A', 'B', 'C', 'D'].map((id) => ({ id, text: id + id }));
    const q = mk({ type: 'RC', passageId: 'p', content: { format: 'select_all', choices: cs }, answer: { choices: ['A'] } });
    expect(checkQuestion(q, passages).join()).toMatch(/GRE has 3/);
  });

  it('select-in-passage answer must appear verbatim', () => {
    const passages = new Map([['p', { id: 'p', field: 'everyday' as const, difficulty: 2 as const, paragraphs: ['First sentence here. Second sentence there.'] }]]);
    const q = mk({ type: 'RC', passageId: 'p', content: { format: 'select_in_passage' }, answer: { sentence: 'Third sentence nowhere.' } });
    expect(checkQuestion(q, passages).join()).toMatch(/exactly one sentence/);
  });

  it('NE: integer format rejects a decimal key; fraction must match value', () => {
    expect(checkQuestion(mk({ type: 'NE', content: { format: 'integer' }, answer: { value: 2.5 } }), none).join()).toMatch(/non-integer/);
    expect(checkQuestion(mk({ type: 'NE', content: { format: 'fraction' }, answer: { value: 0.5, fraction: { numerator: 1, denominator: 3 } } }), none).join()).toMatch(/does not match/);
  });

  it('publishing needs two solvers, a source check and an approver', () => {
    const q = mk({ type: 'QC', content: { quantityA: '1', quantityB: '2' }, answer: { choice: 'B' }, review: { status: 'published', solvedBy: ['a'], sourceChecked: false } });
    const m = checkQuestion(q, none).join();
    expect(m).toMatch(/2 independent solvers/);
    expect(m).toMatch(/sourceChecked/);
    expect(m).toMatch(/approvedBy/);
  });

  it('a lesson whose source is not listed is an error', () => {
    const c = loadContent();
    c.syllabus.lessons[0] = { ...c.syllabus.lessons[0], officialRef: { source: 'blog-post', section: '1', label: 'x' } };
    expect(checkContent(c).errors.map((e) => e.message).join()).toMatch(/not in sources.json/);
  });

  it('word budget ignores math', () => {
    expect(wordCount('The value $a + b + c + d$ is **big**.')).toBe(4);
  });
});
