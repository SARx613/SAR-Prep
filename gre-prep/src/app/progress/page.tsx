'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Loader2, BarChart3 } from 'lucide-react';
import { getQuestionProgress, type ProgressRow } from '@/app/actions/practice';
import { ProgressBreakdown } from '@/components/practice/ProgressBreakdown';

/* Question progress, per section and per category.
 *
 * Bank totals are public, so the breakdown renders signed out too — it just
 * shows an empty progress bar against real totals, and says why. */

export default function ProgressPage() {
  const [rows, setRows] = useState<ProgressRow[] | null>(null);
  const { status } = useSession();

  useEffect(() => {
    // Refetch on sign-in: the totals are the same but the progress is not.
    if (status === 'loading') return;
    let cancelled = false;
    getQuestionProgress()
      .then((r) => !cancelled && setRows(r))
      .catch(() => !cancelled && setRows([]));
    return () => {
      cancelled = true;
    };
  }, [status]);

  return (
    <main className="page">
      <div className="page-container max-w-2xl space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Tableau de bord
          </Link>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-2.5">
            <BarChart3 className="w-7 h-7 text-violet-300" />
            Progression
          </h1>
          <p className="text-[var(--text-secondary)]">
            Ton avancement par section et par type de question.
          </p>
        </div>

        {rows === null ? (
          <div className="flex items-center gap-2 text-[var(--text-secondary)] py-12">
            <Loader2 className="w-5 h-5 animate-spin" />
            Chargement…
          </div>
        ) : (
          <ProgressBreakdown rows={rows} tracked={status === 'authenticated'} />
        )}
      </div>
    </main>
  );
}
