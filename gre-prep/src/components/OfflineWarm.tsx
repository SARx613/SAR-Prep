'use client';

import { useEffect } from 'react';
import { canSaveQuietly, fontUrls, savePage } from '@/lib/offline';

/* Quietly keeps the pages the learner is likely to open next on the device,
 * so a lost connection never stops the lesson in front of them. Runs once the
 * page is idle, only on an unmetered-looking connection, and never blocks. */
export function OfflineWarm({ urls }: { urls: string[] }) {
  useEffect(() => {
    if (!canSaveQuietly()) return;
    let cancelled = false;
    const run = async () => {
      for (const u of [...urls, ...fontUrls()]) {
        if (cancelled || !navigator.onLine) return;
        await savePage(u);
      }
    };
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    const id = w.requestIdleCallback ? w.requestIdleCallback(() => void run()) : window.setTimeout(() => void run(), 1500);
    return () => { cancelled = true; if (!w.requestIdleCallback) window.clearTimeout(id); };
  }, [urls]);
  return null;
}
