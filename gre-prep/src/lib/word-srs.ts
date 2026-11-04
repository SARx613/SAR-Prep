import { notifyLocalChange } from '@/hooks/useLocalValue';

/* Spaced repetition for the vocabulary deck: a Leitner ladder.
 *
 * A word that is answered right moves up one box and comes back after a
 * longer gap; a word that is missed drops two boxes (never below 1) and is due
 * again tomorrow.
 * Only the first answer of a word in a session counts (the caller's rule), so
 * a lucky second try does not push a word out. Kept in localStorage only, like
 * the per-series history. */

export const SRS_KEY = 'gre-prep-word-srs';
export const DAY_MS = 86_400_000;
/** Days until a word is due again, by box (box 1 is the first entry). */
export const INTERVAL_DAYS = [1, 3, 7, 14, 30] as const;
export const MAX_BOX = INTERVAL_DAYS.length;

export interface SrsCard { box: number; due: number }
export type SrsState = Record<number, SrsCard>;

export const NO_SRS: SrsState = {};

export function parseSrs(raw: string | null): SrsState {
  if (!raw) return NO_SRS;
  try {
    const v = JSON.parse(raw) as SrsState;
    return v && typeof v === 'object' ? v : NO_SRS;
  } catch {
    return NO_SRS;
  }
}

/** The state after one first-try answer. Pure. */
export function review(state: SrsState, id: number, correct: boolean, now: number): SrsState {
  const prev = state[id];
  const box = correct ? Math.min(MAX_BOX, (prev?.box ?? 0) + 1) : Math.max(1, (prev?.box ?? 0) - 2);
  const days = correct ? INTERVAL_DAYS[box - 1] : INTERVAL_DAYS[0];
  return { ...state, [id]: { box, due: now + days * DAY_MS } };
}

/** Ids due now, the most overdue first. */
export function dueIds(state: SrsState, now: number): number[] {
  return Object.entries(state)
    .filter(([, c]) => c.due <= now)
    .sort((a, b) => a[1].due - b[1].due)
    .map(([id]) => Number(id));
}

export function loadSrs(): SrsState {
  if (typeof window === 'undefined') return NO_SRS;
  try {
    return parseSrs(localStorage.getItem(SRS_KEY));
  } catch {
    return NO_SRS;
  }
}

/** Records a first-try answer in storage. */
export function recordReview(id: number, correct: boolean, now = Date.now()): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SRS_KEY, JSON.stringify(review(loadSrs(), id, correct, now)));
    notifyLocalChange();
  } catch {
    // Storage full or blocked: the run still counts for mastery.
  }
}
