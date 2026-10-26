import { describe, expect, it } from 'vitest';
import { coverage, streak } from '@/lib/stats';
import type { Attempt } from '@/lib/attempts';

const DAY = 86_400_000;
const mk = (qid: string, correct: boolean, ts: number, mode: Attempt['mode'] = 'tutor'): Attempt =>
  ({ qid, lessonId: 'l', type: 'PS', difficulty: 1, correct, ms: 1, ts, mode });

describe('stats', () => {
  const now = new Date(2026, 5, 15, 12).getTime();
  it('coverage counts a question done when its latest attempt is right', () => {
    const c = coverage([mk('a', false, 1), mk('a', true, 2), mk('b', false, 3)], ['a', 'b', 'c']);
    expect(c).toEqual({ done: 1, total: 3, accuracy: 1 / 3 });
  });
  it('ignores lesson-check attempts', () => {
    expect(coverage([mk('a', true, 1, 'check')], ['a']).done).toBe(0);
  });
  it('streak: consecutive days, today optional', () => {
    expect(streak([mk('a', true, now), mk('a', true, now - DAY), mk('a', true, now - 2 * DAY)], now)).toBe(3);
    expect(streak([mk('a', true, now - DAY), mk('a', true, now - 2 * DAY)], now)).toBe(2);
    expect(streak([mk('a', true, now - 3 * DAY)], now)).toBe(0);
  });
});

import { mergeAttempts, mergeState } from '@/lib/sync';

describe('sync merge rules', () => {
  it('unions attempts and reports only what the server lacks', () => {
    const a = mk('a', true, 1), b = mk('b', false, 2), c = mk('c', true, 3);
    const { merged, toPush } = mergeAttempts([a, b], [b, c]);
    expect(merged.map((x) => x.qid)).toEqual(['a', 'b', 'c']);
    expect(toPush.map((x) => x.qid)).toEqual(['a']);
  });
  it('is idempotent', () => {
    const a = mk('a', true, 1);
    expect(mergeAttempts([a], [a]).toPush).toHaveLength(0);
  });
  it('state: local scalars win, reasons union, newest mock part wins', () => {
    const local = { examDate: '2026-12-01', reasons: { q1: 'guess' as const }, mocks: { m1: { verbal1: { correct: 9, total: 12, ts: 5 } } } };
    const remote = { examDate: '2026-11-01', weeklyHours: 6, reasons: { q2: 'careless' as const }, mocks: { m1: { verbal1: { correct: 4, total: 12, ts: 9 } } } };
    const out = mergeState(local, remote);
    expect(out.examDate).toBe('2026-12-01');
    expect(out.weeklyHours).toBe(6);
    expect(Object.keys(out.reasons!).sort()).toEqual(['q1', 'q2']);
    expect(out.mocks!.m1.verbal1!.correct).toBe(4);
  });
});
