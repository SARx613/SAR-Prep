/* Aggregations over the attempt log, shared by Home and Stats. Pure. */

import type { Attempt } from './attempts';

export interface Coverage { done: number; total: number; accuracy: number | null }

/** Latest result per question → how much of a set of questions is mastered. */
export function latestByQuestion(attempts: Attempt[]): Map<string, Attempt> {
  const m = new Map<string, Attempt>();
  for (const a of attempts) if (a.mode !== 'check') m.set(a.qid, a);
  return m;
}

export function coverage(attempts: Attempt[], questionIds: string[]): Coverage {
  const last = latestByQuestion(attempts);
  const set = new Set(questionIds);
  let done = 0, right = 0, tot = 0;
  for (const a of attempts) if (a.mode !== 'check' && set.has(a.qid)) { tot++; if (a.correct) right++; }
  for (const id of questionIds) if (last.get(id)?.correct) done++;
  return { done, total: questionIds.length, accuracy: tot ? right / tot : null };
}

const dayKey = (ts: number) => {
  const d = new Date(ts);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

/** Consecutive days (ending today or yesterday) with at least one attempt. */
export function streak(attempts: Attempt[], now: number): number {
  const days = new Set(attempts.map((a) => dayKey(a.ts)));
  let n = 0;
  let t = now;
  if (!days.has(dayKey(t))) t -= 86_400_000; // today not done yet doesn't break the streak
  while (days.has(dayKey(t))) { n++; t -= 86_400_000; }
  return n;
}

export function activityByDay(attempts: Attempt[], now: number, days = 14): { day: string; n: number }[] {
  const counts = new Map<string, number>();
  for (const a of attempts) counts.set(dayKey(a.ts), (counts.get(dayKey(a.ts)) ?? 0) + 1);
  return Array.from({ length: days }, (_, i) => {
    const t = now - (days - 1 - i) * 86_400_000;
    return { day: dayKey(t), n: counts.get(dayKey(t)) ?? 0 };
  });
}
