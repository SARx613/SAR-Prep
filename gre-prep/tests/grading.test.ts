import { describe, expect, it } from 'vitest';
import { grade, isSingleSelect, selectionCap } from '@/lib/grading';
import type { Question } from '@/types/questions';

const base = {
  id: 'x', section: 'verbal', topic: 't', subtopic: null, difficulty: 3 as const,
  passageId: null, figureId: null, stem: '', explanation: null, source: null, tags: [],
};
const q = (over: Partial<Question>): Question => ({ ...base, ...over }) as Question;

describe('grade — no partial credit', () => {
  const tc2 = q({ type: 'TC', content: { text: '', blanks: [] }, answer: { blanks: ['1A', '2C'] } });
  it('TC needs every blank right', () => {
    expect(grade(tc2, { kind: 'blanks', ids: ['1A', '2C'] }).isCorrect).toBe(true);
    expect(grade(tc2, { kind: 'blanks', ids: ['1A', '2B'] }).isCorrect).toBe(false);
    expect(grade(tc2, { kind: 'blanks', ids: ['1A', null] }).incomplete).toBe(true);
  });

  const se = q({ type: 'SE', content: { text: '', choices: [] }, answer: { choices: ['B', 'E'] } });
  it('SE needs exactly the two keys', () => {
    expect(grade(se, { kind: 'choices', ids: ['E', 'B'] }).isCorrect).toBe(true);
    expect(grade(se, { kind: 'choices', ids: ['B'] }).incomplete).toBe(true);
    expect(grade(se, { kind: 'choices', ids: ['B', 'E', 'A'] }).isCorrect).toBe(false);
    expect(grade(se, { kind: 'choices', ids: ['B', 'D'] }).isCorrect).toBe(false);
  });

  const qc = q({ type: 'QC', section: 'quant', content: { quantityA: '', quantityB: '' }, answer: { choice: 'C' } });
  it('QC single choice', () => {
    expect(grade(qc, { kind: 'choices', ids: ['C'] }).isCorrect).toBe(true);
    expect(grade(qc, { kind: 'choices', ids: ['A'] }).isCorrect).toBe(false);
    expect(grade(qc, { kind: 'choices', ids: [] }).incomplete).toBe(true);
  });

  const ne = q({ type: 'NE', section: 'quant', content: { format: 'decimal' }, answer: { value: 0.25, tolerance: 0.001 } });
  it('NE respects tolerance', () => {
    expect(grade(ne, { kind: 'numeric', value: 0.2504 }).isCorrect).toBe(true);
    expect(grade(ne, { kind: 'numeric', value: 0.3 }).isCorrect).toBe(false);
    expect(grade(ne, { kind: 'numeric', value: null }).incomplete).toBe(true);
  });

  const all = q({ type: 'PS', section: 'quant', content: { format: 'select_all', choices: [] }, answer: { choices: ['A', 'C'] } });
  it('select_all is exact-match', () => {
    expect(grade(all, { kind: 'choices', ids: ['C', 'A'] }).isCorrect).toBe(true);
    expect(grade(all, { kind: 'choices', ids: ['A'] }).isCorrect).toBe(false);
    expect(grade(all, { kind: 'choices', ids: ['A', 'B', 'C'] }).isCorrect).toBe(false);
    expect(isSingleSelect(all)).toBe(false);
    expect(selectionCap(all)).toBeNull();
  });

  const sip = q({ type: 'RC', content: { format: 'select_in_passage' }, answer: { sentence: 'The cat sat.' } });
  it('select-in-passage ignores whitespace and case', () => {
    expect(grade(sip, { kind: 'sentence', sentence: '  the  cat sat. ' }).isCorrect).toBe(true);
    expect(grade(sip, { kind: 'sentence', sentence: 'Other.' }).isCorrect).toBe(false);
  });
});
