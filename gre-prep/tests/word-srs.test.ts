import { describe, expect, it } from 'vitest';
import { DAY_MS, INTERVAL_DAYS, MAX_BOX, dueIds, parseSrs, review } from '@/lib/word-srs';

const T = 1_000_000_000_000;

describe('srs', () => {
  it('moves a correct word up one box and schedules it further out', () => {
    let s = review({}, 7, true, T);
    expect(s[7]).toEqual({ box: 1, due: T + INTERVAL_DAYS[0] * DAY_MS });
    s = review(s, 7, true, T);
    expect(s[7].box).toBe(2);
    expect(s[7].due).toBe(T + INTERVAL_DAYS[1] * DAY_MS);
  });

  it('caps at the last box', () => {
    let s = {};
    for (let i = 0; i < 12; i++) s = review(s, 1, true, T);
    expect((s as Record<number, { box: number }>)[1].box).toBe(MAX_BOX);
  });

  it('drops a missed word two boxes and brings it back tomorrow', () => {
    let s = {} as Record<number, { box: number; due: number }>;
    for (let i = 0; i < 4; i++) s = review(s, 3, true, T);
    expect(s[3].box).toBe(4);
    s = review(s, 3, false, T);
    expect(s[3]).toEqual({ box: 2, due: T + DAY_MS });
    s = review(s, 3, false, T);
    expect(s[3].box).toBe(1);
  });

  it('lists due words, most overdue first', () => {
    const s = { 1: { box: 1, due: T + 5 }, 2: { box: 2, due: T - 100 }, 3: { box: 1, due: T - 50 } };
    expect(dueIds(s, T)).toEqual([2, 3]);
  });

  it('survives bad storage', () => {
    expect(parseSrs('nope')).toEqual({});
    expect(parseSrs(null)).toEqual({});
  });
});
