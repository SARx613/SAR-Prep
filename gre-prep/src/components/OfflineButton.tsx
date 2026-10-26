'use client';

import { useState } from 'react';
import { CloudDownload } from 'lucide-react';

/* Fetches every lesson and practice page once so the service worker has them. */
export function OfflineButton() {
  const [state, setState] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');

  const run = async () => {
    setError('');
    try {
      const { urls } = (await (await fetch('/api/offline-manifest')).json()) as { urls: string[] };
      setState({ done: 0, total: urls.length });
      let done = 0;
      for (let i = 0; i < urls.length; i += 4) {
        await Promise.all(urls.slice(i, i + 4).map((u) => fetch(u).catch(() => null)));
        done = Math.min(urls.length, i + 4);
        setState({ done, total: urls.length });
      }
    } catch {
      setError('Could not reach the server. Try again when you are online.');
    }
  };

  const busy = state !== null && state.done < state.total;
  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <button onClick={run} disabled={busy} className="inline-flex h-10 items-center gap-2 rounded-[var(--radius)] border border-line-strong px-4 text-sm font-semibold disabled:opacity-60">
        <CloudDownload size={16} aria-hidden />{busy ? `Saving ${state!.done}/${state!.total}…` : state ? 'Saved — run again to refresh' : 'Save for offline'}
      </button>
      {error && <p className="text-xs text-bad">{error}</p>}
    </div>
  );
}
