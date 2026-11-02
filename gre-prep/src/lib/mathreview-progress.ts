'use client';

import { useCallback, useMemo } from 'react';
import { useLocalValue } from '@/hooks/useLocalValue';
import { writeLocal } from '@/lib/local-store';

/* How each Math Review exercise went. The book gives worked answers rather
 * than something to type against, so an exercise is self-assessed: "got it"
 * or "to review". Stored in this browser. */

export type ExerciseStatus = 'ok' | 'review';
export type ExerciseProgress = Record<string, ExerciseStatus>;

const KEY = 'sar-mathreview-progress';
const EMPTY: ExerciseProgress = {};

function parse(raw: string | null): ExerciseProgress {
  if (!raw) return EMPTY;
  try {
    return JSON.parse(raw) as ExerciseProgress;
  } catch {
    return EMPTY;
  }
}

export const exerciseKey = (part: string, n: number) => `${part}:${n}`;

export function useExerciseProgress() {
  const progress = useLocalValue(KEY, parse, EMPTY);

  // Writes start from what is stored right now, so two quick taps never overwrite each other.
  const current = () => parse(localStorage.getItem(KEY));

  const setExercise = useCallback((part: string, n: number, status: ExerciseStatus | null) => {
    const cur = { ...current() };
    if (status) cur[exerciseKey(part, n)] = status;
    else delete cur[exerciseKey(part, n)];
    writeLocal(KEY, JSON.stringify(cur));
  }, []);

  const resetPart = useCallback((part: string) => {
    const cur = Object.fromEntries(Object.entries(current()).filter(([k]) => !k.startsWith(`${part}:`)));
    writeLocal(KEY, JSON.stringify(cur));
  }, []);

  return useMemo(() => ({ progress, setExercise, resetPart }), [progress, setExercise, resetPart]);
}
