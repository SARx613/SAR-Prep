import { describe, expect, it } from 'vitest';
import data from '../content/writing-prompts.json';
import { WRITING_MODELS } from '@/lib/writing-models';
import { diagnose } from '@/lib/writing-tips';

const words = (ps: string[]) => ps.join(' ').split(/\s+/).filter(Boolean).length;

describe('writing models', () => {
  it('covers every practice prompt exactly once', () => {
    const ids = WRITING_MODELS.map((m) => m.promptId).sort();
    expect(ids).toEqual(data.prompts.map((p) => p.id).sort());
  });

  it.each(WRITING_MODELS.map((m) => [m.promptId, m] as const))('%s is complete', (_id, m) => {
    expect(m.thesisOptions).toHaveLength(3);
    expect(m.ideaBank).toHaveLength(4);
    expect(m.outline.length).toBeGreaterThanOrEqual(4);
    expect(m.pitfalls).toHaveLength(3);
    expect(m.counter.objection.length).toBeGreaterThan(20);
    if (!m.samples) return;
    expect(m.samples.map((s) => s.score)).toEqual([6, 4, 2]);
    for (const s of m.samples) {
      const n = words(s.essay);
      const [lo, hi] = s.score === 6 ? [380, 560] : s.score === 4 ? [230, 380] : [90, 200];
      expect(n).toBeGreaterThanOrEqual(lo);
      expect(n).toBeLessThanOrEqual(hi);
      expect(s.annotations.length).toBeGreaterThanOrEqual(4);
      for (const a of s.annotations) expect(s.essay.some((p) => p.includes(a.quote))).toBe(true);
    }
  });
});

describe('diagnose', () => {
  it('flags a short, undeveloped essay', () => {
    const checks = diagnose('Parks are good. Everyone likes parks. They are always useful.');
    expect(checks.find((c) => c.label === 'Length')?.ok).toBe(false);
    expect(checks.find((c) => c.label === 'Concrete examples')?.ok).toBe(false);
    expect(checks.find((c) => c.label === 'Other side')?.ok).toBe(false);
  });
  it('recognises examples and a concession', () => {
    const checks = diagnose('For example, a library helps. Admittedly, books can be read online; however, a library offers shared space because it is public. For instance, children study there.');
    expect(checks.find((c) => c.label === 'Concrete examples')?.ok).toBe(true);
    expect(checks.find((c) => c.label === 'Other side')?.ok).toBe(true);
  });
});
