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
