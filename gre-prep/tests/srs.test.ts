import { describe, expect, it } from 'vitest';
import { buildQueue } from '@/lib/srs';
import type { Attempt } from '@/lib/attempts';

const DAY = 86_400_000;
const at = (qid: string, correct: boolean, ts: number, mode: Attempt['mode'] = 'tutor'): Attempt =>
  ({ qid, lessonId: 'l', type: 'PS', difficulty: 2, correct, ms: 1000, ts, mode });

describe('spaced repetition of missed questions', () => {
  const t0 = 1_000_000_000_000;
  it('a correct-only question never enters the queue', () => {
    const q = buildQueue([at('a', true, t0)], t0 + 10 * DAY);
    expect(q.due.length + q.upcoming.length + q.retired).toBe(0);
  });
  it('a miss is due after one day, not before', () => {
    expect(buildQueue([at('a', false, t0)], t0 + 0.5 * DAY).upcoming).toHaveLength(1);
    expect(buildQueue([at('a', false, t0)], t0 + 1.01 * DAY).due).toHaveLength(1);
  });
  it('a same-session retry does not count as a spaced success', () => {
    const q = buildQueue([at('a', false, t0), at('a', true, t0 + 60_000)], t0 + 2 * DAY);
    expect(q.due).toHaveLength(1);
    expect(q.due[0].stage).toBe(0);
  });
  it('two spaced successes retire the question; the next interval grows', () => {
    const a1 = [at('a', false, t0), at('a', true, t0 + 1 * DAY)];
    const q1 = buildQueue(a1, t0 + 1.5 * DAY);
    expect(q1.upcoming[0].stage).toBe(1);
    expect(q1.upcoming[0].dueAt).toBe(t0 + 1 * DAY + 3 * DAY);
    const q2 = buildQueue([...a1, at('a', true, t0 + 4 * DAY)], t0 + 5 * DAY);
    expect(q2.retired).toBe(1);
  });
  it('a miss after progress resets to stage 0', () => {
    const q = buildQueue([at('a', false, t0), at('a', true, t0 + DAY), at('a', false, t0 + 5 * DAY)], t0 + 6.5 * DAY);
    expect(q.due[0].stage).toBe(0);
  });
  it('lesson check attempts are ignored', () => {
    expect(buildQueue([at('a', false, t0, 'check')], t0 + 5 * DAY).due).toHaveLength(0);
  });
});
