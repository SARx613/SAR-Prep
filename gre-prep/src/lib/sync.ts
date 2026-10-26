/* Pure merge rules for cross-device sync. Nothing here touches storage or the
 * network, so the rules that decide what survives are unit-tested. */

import type { Attempt } from './attempts';
import type { ErrorReason } from './prefs';
import type { MockStore } from './mock';

const key = (a: Attempt) => `${a.qid}|${a.ts}`;

/** Union of both logs (an attempt is identified by question + timestamp) and what the server lacks. */
export function mergeAttempts(local: Attempt[], remote: Attempt[]): { merged: Attempt[]; toPush: Attempt[] } {
  const remoteKeys = new Set(remote.map(key));
  const localKeys = new Set(local.map(key));
  const toPush = local.filter((a) => !remoteKeys.has(key(a)));
  const merged = [...local, ...remote.filter((a) => !localKeys.has(key(a)))].sort((a, b) => a.ts - b.ts);
  return { merged, toPush };
}

export interface SyncState {
  examDate?: string;
  weeklyHours?: number;
  reasons?: Record<string, ErrorReason>;
  mocks?: MockStore;
}

/** Local values win for scalars it has set; reasons and mocks are unions (newest mock part wins). */
export function mergeState(local: SyncState, remote: SyncState | null): SyncState {
  if (!remote) return local;
  const mocks: MockStore = { ...(remote.mocks ?? {}) };
  for (const [kind, rec] of Object.entries(local.mocks ?? {})) {
    const other = mocks[kind] ?? {};
    const out = { ...other, ...rec };
    for (const part of ['verbal1', 'verbal2', 'quant1', 'quant2'] as const) {
      const a = rec[part], b = other[part];
      if (a && b) out[part] = a.ts >= b.ts ? a : b;
    }
    mocks[kind] = out;
  }
  return {
    examDate: local.examDate || remote.examDate,
    weeklyHours: local.weeklyHours || remote.weeklyHours,
    reasons: { ...(remote.reasons ?? {}), ...(local.reasons ?? {}) },
    mocks,
  };
}
