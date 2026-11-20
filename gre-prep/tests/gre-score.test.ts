import { describe, expect, it } from 'vitest';
import { pickChapterTest } from '@/lib/chapter-test';
import { mergeRuns, parseRuns, recordRun, type SavedRun } from '@/lib/run-history';
import { mergeState } from '@/lib/sync';
import {
  MOCK_CONVERSION_27,
  estimateSetScore,
  estimateVocabSeriesScore,
  etsPercentile,
  mockScaledScore,
  ordinal,
  questionPPlus,
} from '@/lib/gre-score';
import type { ClientQuestion } from '@/content/types';
import type { Difficulty } from '@/types/questions';

function mkQuestion(id: string, lessonId: string, difficulty: Difficulty, section: 'quant' | 'verbal' = 'quant'): ClientQuestion {
  return {
    id,
    type: section === 'quant' ? 'PS' : 'TC',
    section,
    topic: lessonId,
    subtopic: null,
    difficulty,
    passageId: null,
    figureId: null,
    stem: `Stem ${id}`,
    content: { format: 'select_one', choices: [{ id: 'A', text: '1' }, { id: 'B', text: '2' }] },
    answer: { choices: ['A'] },
    explanation: 'Explanation text.',
    source: 'sar-prep',
    tags: [],
    lessonId,
    estSeconds: 90,
  };
}

describe('pickChapterTest', () => {
  const pool: ClientQuestion[] = [];
  for (let l = 1; l <= 4; l++) {
    for (const d of [1, 2, 3, 4, 5] as const) {
      for (let k = 0; k < 4; k++) {
        pool.push(mkQuestion(`q2-0${l}-${d}-${k}`, `q2-0${l}`, d));
      }
    }
  }

  it('produces different sets for different seeds', () => {
    const a = pickChapterTest(pool, { dMin: 1, dMax: 5, seed: 'seed-alpha' }).map((q) => q.id);
    const b = pickChapterTest(pool, { dMin: 1, dMax: 5, seed: 'seed-beta' }).map((q) => q.id);
    expect(a).toHaveLength(20);
    expect(b).toHaveLength(20);
    expect(a).not.toEqual(b);
    expect(new Set(a).size).toBe(20);
  });

  it('strictly filters by difficulty range 3..5 and 1..4', () => {
    const hard = pickChapterTest(pool, { dMin: 3, dMax: 5, seed: 's1' });
    expect(hard).toHaveLength(20);
    expect(hard.every((q) => q.difficulty >= 3 && q.difficulty <= 5)).toBe(true);

    const lower = pickChapterTest(pool, { dMin: 1, dMax: 4, seed: 's2' });
    expect(lower).toHaveLength(20);
    expect(lower.every((q) => q.difficulty >= 1 && q.difficulty <= 4)).toBe(true);
  });

  it('falls back to full pool if no questions match the range', () => {
    const onlyEasy = [mkQuestion('q1', 'l1', 1), mkQuestion('q2', 'l2', 2)];
    const out = pickChapterTest(onlyEasy, { dMin: 5, dMax: 5, seed: 's3' });
    expect(out).toHaveLength(2);
  });
});

describe('GRE score & percentile estimation', () => {
  it('returns realistic ETS P+ values bounded by difficulty', () => {
    const easyP = questionPPlus({ id: 'q-1', section: 'quant', difficulty: 1 });
    const hardP = questionPPlus({ id: 'q-5', section: 'quant', difficulty: 5 });
    expect(easyP).toBeGreaterThanOrEqual(68);
    expect(easyP).toBeLessThanOrEqual(88);
    expect(hardP).toBeGreaterThanOrEqual(12);
    expect(hardP).toBeLessThanOrEqual(34);
    expect(easyP).toBeGreaterThan(hardP);
  });

  it('awards a higher GRE estimate for harder question sets at the same accuracy', () => {
    const easySet = Array.from({ length: 20 }, (_, i) => ({
      id: `e-${i}`,
      section: 'quant' as const,
      difficulty: i % 2 === 0 ? 1 : 2,
      correct: i < 14,
    }));
    const hardSet = Array.from({ length: 20 }, (_, i) => ({
      id: `h-${i}`,
      section: 'quant' as const,
      difficulty: i % 2 === 0 ? 4 : 5,
      correct: i < 14,
    }));
    const easyEst = estimateSetScore(easySet, 'quant')!;
    const hardEst = estimateSetScore(hardSet, 'quant')!;
    expect(hardEst.scaled).toBeGreaterThan(easyEst.scaled);
    expect(hardEst.percentile).toBeGreaterThan(easyEst.percentile);
  });

  it('maps 0 correct to 130 and perfect hard sets to 170', () => {
    const zero = estimateSetScore(
      [{ section: 'verbal', difficulty: 3, correct: false }],
      'verbal',
    )!;
    expect(zero.scaled).toBe(130);
    expect(zero.percentile).toBe(1);

    const perfectHard = estimateSetScore(
      Array.from({ length: 15 }, (_, i) => ({ id: `vh-${i}`, section: 'verbal' as const, difficulty: 4, correct: true })),
      'verbal',
    )!;
    expect(perfectHard.scaled).toBe(170);
    expect(perfectHard.percentile).toBe(99);
  });

  it('defines monotonic 0..27 mock conversion tables within 130..170', () => {
    for (const sec of ['verbal', 'quant'] as const) {
      for (const lv of ['easy', 'medium', 'hard'] as const) {
        const table = MOCK_CONVERSION_27[sec][lv];
        expect(table).toHaveLength(28);
        for (let i = 0; i < 28; i++) {
          expect(table[i]).toBeGreaterThanOrEqual(130);
          expect(table[i]).toBeLessThanOrEqual(170);
          if (i > 0) expect(table[i]).toBeGreaterThanOrEqual(table[i - 1]);
        }
      }
    }
    expect(mockScaledScore('quant', 27, 27, 'hard').scaled).toBe(170);
    expect(mockScaledScore('verbal', 0, 27, 'hard').scaled).toBe(130);
  });

  it('estimates vocab series scores and formats percentiles cleanly', () => {
    const vocab = estimateVocabSeriesScore(16, 20, false);
    expect(vocab.scaled).toBeGreaterThanOrEqual(150);
    expect(vocab.scaled).toBeLessThanOrEqual(170);
    expect(etsPercentile('verbal', 160)).toBeGreaterThan(etsPercentile('quant', 160));
    expect(ordinal(1)).toBe('1st');
    expect(ordinal(2)).toBe('2nd');
    expect(ordinal(3)).toBe('3rd');
    expect(ordinal(11)).toBe('11th');
    expect(ordinal(68)).toBe('68th');
  });
});

describe('frozen run history & cloud merge', () => {
  const mkRun = (id: string, completedAt: number, correct = 1): SavedRun => ({
    id,
    title: `Run ${id}`,
    kind: 'chapter',
    setId: 'chapter-q2',
    chapterId: 'q2',
    backHref: '/learn/q2',
    mode: 'timed',
    completedAt,
    totalMs: 60_000,
    correct,
    total: 2,
    items: [
      { qid: 'q1', sel: { ids: ['A'], blanks: [], numeric: '', numerator: '', denominator: '', sentence: '' }, correct: true, ms: 30_000 },
      { qid: 'q2', sel: { ids: ['B'], blanks: [], numeric: '', numerator: '', denominator: '', sentence: '' }, correct: correct > 1, ms: 30_000 },
    ],
  });

  it('parses runs safely and deduplicates/sorts on merge', () => {
    expect(parseRuns(null)).toEqual([]);
    expect(parseRuns('{bad json')).toEqual([]);

    const r1 = mkRun('r1', 1000, 1);
    const r1Newer = mkRun('r1', 1500, 2);
    const r2 = mkRun('r2', 2000, 2);

    const merged = mergeRuns([r1Newer], [r1, r2]);
    expect(merged.map((r) => r.id)).toEqual(['r2', 'r1']);
    expect(merged[1].correct).toBe(2);
  });

  it('merges frozen runs inside sync state without losing local or remote runs', () => {
    const localRun = mkRun('local-1', 2000);
    const remoteRun = mkRun('remote-1', 1000);
    const mergedState = mergeState({ runs: [localRun] }, { runs: [remoteRun] });
    expect(mergedState.runs?.map((r) => r.id)).toEqual(['local-1', 'remote-1']);
  });

  it('records runs in memory storage when localStorage is available', () => {
    const store = new Map<string, string>();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => { store.set(k, v); },
      removeItem: (k: string) => { store.delete(k); },
    };
    (globalThis as { window?: unknown }).window = { dispatchEvent: () => true };
    try {
      const r1 = mkRun('a', 100);
      const r2 = mkRun('b', 200);
      recordRun(r1);
      const out = recordRun(r2);
      expect(out.map((r) => r.id)).toEqual(['b', 'a']);
      expect(parseRuns(store.get('sar-run-history-v1') ?? null)).toHaveLength(2);
    } finally {
      delete (globalThis as { localStorage?: unknown }).localStorage;
      delete (globalThis as { window?: unknown }).window;
    }
  });
});
