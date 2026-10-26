'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { mergeProgress } from '@/app/actions/progress';
import { loadProgress, saveProgress } from '@/lib/storage';

/* Once signed in, merge local vocabulary progress into the cloud copy and
 * keep the merged result locally. Never blocks rendering; the local copy is
 * always valid on its own. Attempt sync lands with the attempts table. */

export function CloudSync() {
  const { status } = useSession();
  useEffect(() => {
    if (status !== 'authenticated') return;
    let cancelled = false;
    mergeProgress(loadProgress())
      .then((merged) => {
        if (!cancelled) saveProgress(merged);
      })
      .catch(() => { /* offline: local stays valid */ });
    return () => { cancelled = true; };
  }, [status]);
  return null;
}
