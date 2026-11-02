import type { Answer, ExamResult } from '@/types/official';
import { writeLocal } from '@/lib/local-store';

/* A test in progress lives in localStorage, so closing the tab or hitting
 * reload does not throw away three and a half hours. The clock is stored as
 * an absolute deadline (not a countdown), so it keeps running while the page
 * is away — which is also how the real exam treats a dropped connection. */

export type Phase = 'section-intro' | 'section' | 'review' | 'break' | 'submitting' | 'done';

export interface RunState {
  v: 1;
  examId: string;
  startedAt: number;
  phase: Phase;
  sectionIndex: number;
  questionIndex: number;
  answers: Record<string, Record<number, Answer>>;
  essays: Record<string, string>;
  marked: Record<string, number[]>;
  timeMs: Record<string, Record<number, number>>;
  /** Epoch ms at which the current section stops, while one is running. */
  sectionEndsAt: number | null;
  breakEndsAt: number | null;
  result: ExamResult | null;
}

export const runKey = (examId: string) => `sar-exam-run:${examId}`;
export const HISTORY_KEY = 'sar-exam-history';

export function newRun(examId: string): RunState {
  return {
    v: 1,
    examId,
    startedAt: Date.now(),
    phase: 'section-intro',
    sectionIndex: 0,
    questionIndex: 0,
    answers: {},
    essays: {},
    marked: {},
    timeMs: {},
    sectionEndsAt: null,
    breakEndsAt: null,
    result: null,
  };
}

export function loadRun(examId: string): RunState | null {
  try {
    const raw = localStorage.getItem(runKey(examId));
    if (!raw) return null;
    const run = JSON.parse(raw) as RunState;
    return run.v === 1 && run.examId === examId ? run : null;
  } catch {
    return null;
  }
}

export function saveRun(run: RunState): void {
  try {
    writeLocal(runKey(run.examId), JSON.stringify(run));
  } catch {
    /* storage full or blocked: the test still works, it just cannot resume */
  }
}

export function clearRun(examId: string): void {
  try {
    localStorage.removeItem(runKey(examId));
  } catch {
    /* ignore */
  }
}

/* ── Local history (signed-out users, and a fallback when offline) ────── */

export interface LocalHistoryEntry {
  examId: string;
  completedAt: string;
  verbal: number;
  quant: number;
}

export function parseLocalHistory(raw: string | null): LocalHistoryEntry[] {
  try {
    return raw ? (JSON.parse(raw) as LocalHistoryEntry[]) : [];
  } catch {
    return [];
  }
}

export function loadLocalHistory(): LocalHistoryEntry[] {
  try {
    return parseLocalHistory(localStorage.getItem(HISTORY_KEY));
  } catch {
    return [];
  }
}

export function pushLocalHistory(result: ExamResult): void {
  try {
    const list = loadLocalHistory();
    list.unshift({
      examId: result.examId,
      completedAt: result.completedAt,
      verbal: result.verbal.scaled,
      quant: result.quant.scaled,
    });
    writeLocal(HISTORY_KEY, JSON.stringify(list.slice(0, 30)));
  } catch {
    /* ignore */
  }
}
