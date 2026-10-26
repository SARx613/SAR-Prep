import { describe, expect, it } from 'vitest';
import { buildPart, estimateScore, levelFor, sectionEstimate } from '@/lib/mock';
import { buildPlan } from '@/lib/plan';
import type { QIndexItem } from '@/content/qindex';

let n = 0;
const mk = (type: string, section: 'verbal' | 'quant', chapter: string, difficulty: number, extra: Partial<QIndexItem> = {}): QIndexItem =>
  ({ id: `q${n++}`, lessonId: `${chapter}-01-x`, chapter, type, section, difficulty, ...extra });

const pool: QIndexItem[] = [];
for (const d of [1, 2, 3, 4, 5]) {
  for (let i = 0; i < 8; i++) {
    pool.push(mk('QC', 'quant', 'q1', d), mk('PS', 'quant', 'q2', d), mk('NE', 'quant', 'q3', d), mk('TC', 'verbal', 'v1', d), mk('SE', 'verbal', 'v2', d));
    pool.push(mk('DI', 'quant', 'q4', d, { figureKey: `f${d}${i % 3}` }), mk('RC', 'verbal', 'v3', d, { passageId: `p${d}${i % 3}` }));
  }
}

describe('mock sections', () => {
  it('have the real sizes: 12 then 15', () => {
    expect(buildPart(pool, 'verbal', 1, 'avg', 'm1')).toHaveLength(12);
    expect(buildPart(pool, 'quant', 2, 'hard', 'm1')).toHaveLength(15);
  });
  it('are deterministic and never repeat a question', () => {
    const a = buildPart(pool, 'quant', 1, 'avg', 'm1'), b = buildPart(pool, 'quant', 1, 'avg', 'm1');
    expect(a).toEqual(b);
    expect(new Set(a).size).toBe(a.length);
  });
  it('second section follows its level band', () => {
    const byId = new Map(pool.map((q) => [q.id, q]));
    const hard = buildPart(pool, 'quant', 2, 'hard', 'm2', new Set(buildPart(pool, 'quant', 1, 'avg', 'm2')));
    expect(hard.every((id) => byId.get(id)!.difficulty >= 3)).toBe(true);
    const easy = buildPart(pool, 'quant', 2, 'easy', 'm2');
    expect(easy.every((id) => byId.get(id)!.difficulty <= 3)).toBe(true);
  });
  it('keeps RC questions of a passage together', () => {
    const byId = new Map(pool.map((q) => [q.id, q]));
    const ids = buildPart(pool, 'verbal', 1, 'avg', 'm3').filter((id) => byId.get(id)!.type === 'RC');
    const passages = ids.map((id) => byId.get(id)!.passageId);
    // consecutive runs: a passage id never reappears after a different one
    const seen = new Set<string>(); let prev = '';
    for (const p of passages) { if (p !== prev) { expect(seen.has(p!)).toBe(false); seen.add(p!); prev = p!; } }
  });
  it('excluded ids are not reused', () => {
    const s1 = new Set(buildPart(pool, 'verbal', 1, 'avg', 'm4'));
    expect(buildPart(pool, 'verbal', 2, 'medium', 'm4', s1).some((id) => s1.has(id))).toBe(false);
  });
});

describe('adaptive level and estimate', () => {
  it('routes by first-section score', () => {
    expect(levelFor(10, 12)).toBe('hard');
    expect(levelFor(6, 12)).toBe('medium');
    expect(levelFor(3, 12)).toBe('easy');
  });
  it('a harder second section is worth more for the same raw score', () => {
    const hard = estimateScore(8, 12, 9, 15, 'hard').mid, easy = estimateScore(8, 12, 9, 15, 'easy').mid;
    expect(hard).toBeGreaterThan(easy);
  });
  it('stays within 130–170', () => {
    expect(estimateScore(0, 12, 0, 15, 'easy').low).toBe(130);
    expect(estimateScore(12, 12, 15, 15, 'hard').high).toBe(170);
  });
  it('needs both parts', () => {
    expect(sectionEstimate({ verbal1: { correct: 5, total: 12, ts: 1 } }, 'verbal')).toBeNull();
  });
});

describe('study plan', () => {
  const lessons = ['a', 'b', 'c', 'd'].map((id, i) => ({ id, chapter: i < 2 ? 'q1' : 'q2', title: id, minutes: 30, remainingMinutes: 60 }));
  const now = new Date('2026-01-01T00:00:00Z');
  it('puts weak chapters first and never drops a lesson', () => {
    const w = buildPlan({ lessons, weakChapters: ['q2'], examDate: new Date('2026-01-22T00:00:00Z'), hoursPerWeek: 2, now, mocksDone: 0, mockCount: 6 });
    expect(w).toHaveLength(3);
    expect(w[0].items.find((i) => i.kind === 'lesson')!.id).toBe('c');
    expect(w.flatMap((x) => x.items).filter((i) => i.kind === 'lesson')).toHaveLength(4);
  });
  it('schedules a mock in the final week', () => {
    const w = buildPlan({ lessons, weakChapters: [], examDate: new Date('2026-01-29T00:00:00Z'), hoursPerWeek: 5, now, mocksDone: 0, mockCount: 6 });
    expect(w[w.length - 1].items.some((i) => i.kind === 'mock')).toBe(true);
  });
  it('a past test date still yields a one-week plan', () => {
    expect(buildPlan({ lessons, weakChapters: [], examDate: new Date('2025-01-01'), hoursPerWeek: 3, now, mocksDone: 0, mockCount: 6 })).toHaveLength(1);
  });
});
