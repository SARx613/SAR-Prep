'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { mergeProgress } from '@/app/actions/progress';
import { pullAttempts, pullState, pushAttempts, pushState } from '@/app/actions/sync';
import { ATTEMPTS_EVENT, ATTEMPTS_KEY, readAttempts } from '@/lib/attempts';
import { MOCKS_KEY, parseMocks } from '@/lib/mock';
import { EXAM_DATE_KEY, REASONS_KEY, WEEKLY_HOURS_KEY, parseNumber, parseReasons, parseString } from '@/lib/prefs';
import { mergeAttempts, mergeState, type SyncState } from '@/lib/sync';
import { loadProgress, saveProgress } from '@/lib/storage';

/* Once signed in: merge vocabulary progress, practice attempts and the small
 * preferences blob with the cloud copy, in both directions, and keep the
 * merged result locally. Never blocks rendering; the local copy is always
 * valid on its own, so a failed sync only means "try again next visit". */

const notify = () => window.dispatchEvent(new Event('gre-prep:storage'));

function readState(): SyncState {
  return {
    examDate: parseString(localStorage.getItem(EXAM_DATE_KEY)) || undefined,
    weeklyHours: parseNumber(localStorage.getItem(WEEKLY_HOURS_KEY)) || undefined,
    reasons: parseReasons(localStorage.getItem(REASONS_KEY)),
    mocks: parseMocks(localStorage.getItem(MOCKS_KEY)),
  };
}

function writeState(s: SyncState) {
  if (s.examDate) localStorage.setItem(EXAM_DATE_KEY, s.examDate);
  if (s.weeklyHours) localStorage.setItem(WEEKLY_HOURS_KEY, String(s.weeklyHours));
  localStorage.setItem(REASONS_KEY, JSON.stringify(s.reasons ?? {}));
  localStorage.setItem(MOCKS_KEY, JSON.stringify(s.mocks ?? {}));
}

export function CloudSync() {
  const { status } = useSession();
  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    let running = false;
    let again = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const sync = async () => {
      if (running) { again = true; return; }
      running = true;
      try {
        const merged = await mergeProgress(loadProgress());
        if (!cancelled) saveProgress(merged);

        const remote = await pullAttempts();
        const { merged: all, toPush } = mergeAttempts(readAttempts(), remote);
        if (!cancelled) { localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all)); }
        if (toPush.length) await pushAttempts(toPush);

        const state = mergeState(readState(), await pullState());
        if (!cancelled) writeState(state);
        await pushState(state);
        if (!cancelled) notify();
      } catch { /* offline or server hiccup: local stays valid, the next answer or visit retries */ }
      running = false;
      if (again && !cancelled) { again = false; void sync(); }
    };

    void sync();
    // New answers go to the account a few seconds after the last one, not only when the app opens.
    const onAttempt = () => {
      if (!navigator.onLine) return;
      clearTimeout(timer);
      timer = setTimeout(() => void sync(), 5000);
    };
    const onOnline = () => void sync();
    window.addEventListener(ATTEMPTS_EVENT, onAttempt);
    window.addEventListener('online', onOnline);
    return () => {
      cancelled = true;
      clearTimeout(timer);
      window.removeEventListener(ATTEMPTS_EVENT, onAttempt);
      window.removeEventListener('online', onOnline);
    };
  }, [status]);
  return null;
}
