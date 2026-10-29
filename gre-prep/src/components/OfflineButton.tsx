'use client';

import { useEffect, useState } from 'react';
import { CloudDownload } from 'lucide-react';
import { offlineStatus, saveAll } from '@/lib/offline';

/* Fetches every lesson and practice page once so the service worker has them. */
export function OfflineButton() {
  const [state, setState] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const refreshNote = () => offlineStatus().then((s) =>
    setNote(!s ? 'Not downloaded yet' : s.intact ? `Downloaded ${new Date(s.at).toLocaleDateString()} · ${s.pages} pages` : 'Device storage was cleared: download again'));
  useEffect(() => { void refreshNote(); }, []);

  const run = async () => {
    setError('');
    try {
      await saveAll((done, total) => setState({ done, total }));
      await refreshNote();
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
      {note && !busy && <p className="text-xs text-muted">{note}</p>}
      {error && <p className="text-xs text-bad">{error}</p>}
    </div>
  );
}
