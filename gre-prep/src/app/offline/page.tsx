import type { Metadata } from 'next';
import Link from 'next/link';
import { RetryButton } from './RetryButton';

export const metadata: Metadata = { title: 'Offline' };

/* Shown when a page was never opened or saved while online. */
export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-2xl font-extrabold tracking-tight">You are offline</h1>
      <p className="text-muted">
        This page has not been saved on this device yet. Pages you have already opened, and everything you saved with
        “Save for offline” in Settings, still work.
      </p>
      <div className="flex gap-3">
        <RetryButton />
        <Link href="/" className="inline-flex h-11 items-center rounded-[var(--radius)] border border-line-strong px-5 text-sm font-semibold">Home</Link>
      </div>
    </main>
  );
}
