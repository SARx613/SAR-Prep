/* Frozen history of completed practice sets, chapter tests, diagnostics, and mock sections.
 * Stored locally in localStorage and synced to the user's Google account via CloudSync. */

import type { Selection } from '@/components/exam/selection';
import type { GreScoreEstimate } from './gre-score';

export interface SavedRunItem {
  qid: string;
  sel: Selection;
  correct: boolean;
  incomplete?: boolean;
  ms: number;
}

export type RunKind = 'chapter' | 'lesson' | 'custom' | 'mock' | 'diag';

export interface SavedRun {
  id: string;
  title: string;
  kind?: RunKind;
  setId?: string;
  chapterId?: string;
  backHref: string;
  mode: 'tutor' | 'timed';
  completedAt: number;
  totalMs: number;
  correct: number;
  total: number;
  estimates?: {
    verbal?: GreScoreEstimate | null;
    quant?: GreScoreEstimate | null;
  };
  mockScore?: {
    section: 'verbal' | 'quant';
    scaled: number;
    percentile: number;
    part1Correct: number;
    part1Total: number;
    level: 'easy' | 'medium' | 'hard';
  } | null;
  items: SavedRunItem[];
}

export const RUN_HISTORY_KEY = 'sar-run-history-v1';
export const SYNC_NOW_EVENT = 'gre-prep:sync-now';
export const SYNC_STATUS_EVENT = 'gre-prep:sync-status';
export const MAX_RUNS = 100;
export const NO_RUNS: SavedRun[] = [];

export function parseRuns(raw: string | null): SavedRun[] {
  if (!raw) return NO_RUNS;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedRun[]) : NO_RUNS;
  } catch {
    return NO_RUNS;
  }
}

export function readRuns(): SavedRun[] {
  if (typeof window === 'undefined') return NO_RUNS;
  try {
    return parseRuns(localStorage.getItem(RUN_HISTORY_KEY));
  } catch {
    return NO_RUNS;
  }
}

export function writeRuns(runs: SavedRun[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(runs.slice(0, MAX_RUNS)));
  } catch {
    /* storage full or blocked */
  }
}

export function mergeRuns(local: readonly SavedRun[], remote: readonly SavedRun[]): SavedRun[] {
  const byId = new Map<string, SavedRun>();
  for (const r of [...remote, ...local]) {
    if (!r || !r.id) continue;
    const prev = byId.get(r.id);
    if (!prev || r.completedAt >= prev.completedAt) byId.set(r.id, r);
  }
  return [...byId.values()].sort((a, b) => b.completedAt - a.completedAt).slice(0, MAX_RUNS);
}

export function recordRun(run: SavedRun): SavedRun[] {
  const merged = mergeRuns([run], readRuns());
  writeRuns(merged);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('gre-prep:storage'));
    window.dispatchEvent(new Event(SYNC_NOW_EVENT));
  }
  return merged;
}

export function historyHref(run: SavedRun): string {
  const ids = run.items.map((i) => i.qid).join(',');
  return `/exam/history/${encodeURIComponent(run.id)}?ids=${encodeURIComponent(ids)}`;
}
