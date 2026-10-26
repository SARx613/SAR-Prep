import { describe, expect, it } from 'vitest';
import { generateBank, validate } from '@/lib/generators';

describe('generators', () => {
  it('are deterministic for a given seed', () => {
    const a = generateBank({ perTemplateDifficulty: 2, seed: 7 });
    const b = generateBank({ perTemplateDifficulty: 2, seed: 7 });
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('only emit items that validate', () => {
    const bank = generateBank({ perTemplateDifficulty: 3, seed: 11 });
    expect(bank.questions.length).toBeGreaterThan(50);
    const all = [...bank.questions, ...bank.passages.flatMap((p) => p.questions)];
    for (const q of all) expect(validate(q), q.template).toEqual([]);
  });
});
