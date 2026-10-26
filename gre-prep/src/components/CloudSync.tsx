'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { mergeProgress } from '@/app/actions/progress';
import { pullAttempts, pullState, pushAttempts, pushState } from '@/app/actions/sync';
import { ATTEMPTS_KEY, readAttempts } from '@/lib/attempts';
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
    (async () => {
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
      } catch { /* offline or server hiccup: local stays valid */ }
    })();
    return () => { cancelled = true; };
  }, [status]);
  return null;
}
