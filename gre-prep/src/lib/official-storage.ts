import type { Answer, ExamResponses, ExamResult } from '@/types/official';
import { writeLocal } from '@/lib/local-store';
import { pendingErrata, remapAnswers } from '@/lib/official-errata';
import { rescoreExam } from '@/app/actions/official';

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
  /** Errata (official-errata.ts) already applied to these answers and this result. */
  errata?: string[];
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
  verbal: number | null;
  quant: number | null;
  correct?: number;
  total?: number;
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
      correct: result.verbal.raw + result.quant.raw,
      total: result.verbal.total + result.quant.total,
    });
    writeLocal(HISTORY_KEY, JSON.stringify(list.slice(0, 30)));
  } catch {
    /* ignore */
  }
}

/* ── Errata ────────────────────────────────────────────────────────────── */

/**
 * Brings a saved run up to date with the errata published since it started:
 * answers given on a wrongly displayed question are translated into the
 * corrected question and, for a finished test, the score is computed again
 * (the result and its history entry keep their original date). Returns the
 * run as saved; an unchanged run when nothing applies or the server cannot be
 * reached (the errata then stay pending for the next visit).
 */
export async function applyErrata(examId: string): Promise<RunState | null> {
  const run = loadRun(examId);
  if (!run || run.phase === 'submitting') return run;
  const errata = pendingErrata(examId, run.startedAt, run.errata);
  if (!errata.length) return run;
  const answers = remapAnswers(run.answers, errata);
  const applied = [...(run.errata ?? []), ...errata.map((e) => e.id)];
  let result = run.result;
  if (run.phase === 'done' && result) {
    const ids = new Set([...Object.keys(answers), ...Object.keys(run.essays), ...Object.keys(result.sections)]);
    const responses: ExamResponses = {};
    for (const id of ids) responses[id] = { answers: answers[id] ?? {}, essay: run.essays[id] };
    const old = result;
    try {
      result = await rescoreExam(examId, responses, run.timeMs, old.completedAt);
    } catch {
      return run;
    }
    const list = loadLocalHistory();
    const i = list.findIndex((h) => h.examId === examId && h.completedAt === old.completedAt);
    if (i >= 0) {
      list[i] = { ...list[i], verbal: result.verbal.scaled, quant: result.quant.scaled };
      writeLocal(HISTORY_KEY, JSON.stringify(list));
    }
  }
  const next: RunState = { ...run, answers, result, errata: applied };
  saveRun(next);
  return next;
}
