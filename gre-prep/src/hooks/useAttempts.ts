'use client';

import { ATTEMPTS_KEY, type Attempt } from '@/lib/attempts';
import { useLocalValue } from './useLocalValue';

const NONE: Attempt[] = [];

function parse(raw: string | null): Attempt[] {
  if (!raw) return NONE;
  try {
    const v = JSON.parse(raw);
    return Array.isArray(v) ? (v as Attempt[]) : NONE;
  } catch {
    return NONE;
  }
}

/** All local attempts, as an external store: no mount effect, updates across tabs. */
export function useAttempts(): Attempt[] {
  return useLocalValue(ATTEMPTS_KEY, parse, NONE);
}

export interface LessonStats {
  attempted: number;
  /** Distinct questions whose latest attempt was correct. */
  mastered: number;
  accuracy: number | null;
}

export function lessonStats(attempts: Attempt[], lessonId: string): LessonStats {
  const last = new Map<string, boolean>();
  let right = 0, total = 0;
  for (const a of attempts) {
    if (a.lessonId !== lessonId || a.mode === 'check') continue;
    last.set(a.qid, a.correct);
    total++;
    if (a.correct) right++;
  }
  return { attempted: last.size, mastered: [...last.values()].filter(Boolean).length, accuracy: total ? right / total : null };
}
