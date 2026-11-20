'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useSession } from 'next-auth/react';
import { mergeProgress } from '@/app/actions/progress';
import { pullAttempts, pullState, pushAttempts, pushState } from '@/app/actions/sync';
import { ATTEMPTS_EVENT, ATTEMPTS_KEY, readAttempts } from '@/lib/attempts';
import { MOCKS_KEY, parseMocks } from '@/lib/mock';
import { EXAM_DATE_KEY, REASONS_KEY, WEEKLY_HOURS_KEY, parseNumber, parseReasons, parseString } from '@/lib/prefs';
import { RUN_HISTORY_KEY, SYNC_NOW_EVENT, SYNC_STATUS_EVENT, parseRuns, writeRuns } from '@/lib/run-history';
import { mergeAttempts, mergeState, type SyncState } from '@/lib/sync';
import { loadProgress, saveProgress } from '@/lib/storage';

/* Once signed in: merge vocabulary progress, practice attempts, frozen run
 * history and preferences with the cloud copy, in both directions, and keep the
 * merged result locally. Never blocks rendering; the local copy is always
 * valid on its own, so a failed sync only means "try again next visit". */

export type SyncStateKind = 'idle' | 'syncing' | 'synced' | 'error';

let currentSyncState: SyncStateKind = 'idle';

function setSyncState(next: SyncStateKind) {
  if (currentSyncState === next) return;
  currentSyncState = next;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(SYNC_STATUS_EVENT));
  }
}

function subscribeSyncStatus(onChange: () => void): () => void {
  window.addEventListener(SYNC_STATUS_EVENT, onChange);
  return () => window.removeEventListener(SYNC_STATUS_EVENT, onChange);
}

export function useCloudSyncStatus(): { authenticated: boolean; state: SyncStateKind } {
  const { status } = useSession();
  const state = useSyncExternalStore(
    subscribeSyncStatus,
    () => currentSyncState,
    () => 'idle' as SyncStateKind,
  );
  return { authenticated: status === 'authenticated', state };
}

const notify = () => window.dispatchEvent(new Event('gre-prep:storage'));

function readState(): SyncState {
  return {
    examDate: parseString(localStorage.getItem(EXAM_DATE_KEY)) || undefined,
    weeklyHours: parseNumber(localStorage.getItem(WEEKLY_HOURS_KEY)) || undefined,
    reasons: parseReasons(localStorage.getItem(REASONS_KEY)),
    mocks: parseMocks(localStorage.getItem(MOCKS_KEY)),
    runs: parseRuns(localStorage.getItem(RUN_HISTORY_KEY)),
  };
}

function writeState(s: SyncState) {
  if (s.examDate) localStorage.setItem(EXAM_DATE_KEY, s.examDate);
  if (s.weeklyHours) localStorage.setItem(WEEKLY_HOURS_KEY, String(s.weeklyHours));
  localStorage.setItem(REASONS_KEY, JSON.stringify(s.reasons ?? {}));
  localStorage.setItem(MOCKS_KEY, JSON.stringify(s.mocks ?? {}));
  if (s.runs) writeRuns(s.runs);
}

export function CloudSync() {
  const { status } = useSession();
  useEffect(() => {
    if (status !== 'authenticated') {
      setSyncState('idle');
      return;
    }
    let cancelled = false;
    let running = false;
    let again = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const sync = async () => {
      if (running) { again = true; return; }
      running = true;
      setSyncState('syncing');
      let failed = false;
      try {
        const merged = await mergeProgress(loadProgress());
        if (!cancelled) saveProgress(merged);

        const remote = await pullAttempts();
        const { merged: all, toPush } = mergeAttempts(readAttempts(), remote);
        if (!cancelled) { localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all)); }
        if (toPush.length) {
          const pushed = await pushAttempts(toPush);
          if (!pushed.ok) failed = true;
        }

        const state = mergeState(readState(), await pullState());
        if (!cancelled) writeState(state);
        const stateRes = await pushState(state);
        if (!stateRes.ok) failed = true;
        if (!cancelled) notify();
      } catch {
        failed = true;
      }
      running = false;
      if (again && !cancelled) {
        again = false;
        void sync();
      } else if (!cancelled) {
        setSyncState(failed ? 'error' : 'synced');
      }
    };

    void sync();
    // New answers go to the account shortly after the last one; completed runs sync right away.
    const onAttempt = () => {
      if (!navigator.onLine) return;
      clearTimeout(timer);
      timer = setTimeout(() => void sync(), 2000);
    };
    const onSyncNow = () => {
      if (!navigator.onLine) return;
      clearTimeout(timer);
      void sync();
    };
    const onOnline = () => void sync();
    window.addEventListener(ATTEMPTS_EVENT, onAttempt);
    window.addEventListener(SYNC_NOW_EVENT, onSyncNow);
    window.addEventListener('online', onOnline);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener(ATTEMPTS_EVENT, onAttempt);
      window.removeEventListener(SYNC_NOW_EVENT, onSyncNow);
      window.removeEventListener('online', onOnline);
    };
  }, [status]);
  return null;
}
