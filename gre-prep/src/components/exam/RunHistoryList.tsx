'use client';

import Link from 'next/link';
import { ordinal } from '@/lib/gre-score';
import { historyHref, type SavedRun } from '@/lib/run-history';

function fmtDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

export function RunHistoryList({
  runs,
  limit,
  emptyText = 'Finish a chapter test, lesson set, or practice series and it will appear here with full corrections.',
}: {
  runs: SavedRun[];
  limit?: number;
  emptyText?: string;
}) {
  const shown = limit ? runs.slice(0, limit) : runs;
  if (shown.length === 0) {
    return <p className="mt-2 text-sm text-muted">{emptyText}</p>;
  }

  return (
    <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[var(--radius)] border border-line bg-surface">
      {shown.map((run) => {
        const pct = run.total > 0 ? Math.round((run.correct / run.total) * 100) : 0;
        const missedIds = run.items.filter((i) => !i.correct).map((i) => i.qid);
        const badges: string[] = [];
        if (run.mockScore) {
          badges.push(`Mock ${run.mockScore.scaled}/170 (${ordinal(run.mockScore.percentile)} %ile)`);
        } else {
          if (run.estimates?.verbal) {
            badges.push(`Verbal ${run.estimates.verbal.scaled} (${ordinal(run.estimates.verbal.percentile)} %ile)`);
          }
          if (run.estimates?.quant) {
            badges.push(`Quant ${run.estimates.quant.scaled} (${ordinal(run.estimates.quant.percentile)} %ile)`);
          }
        }

        return (
          <li key={run.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 text-sm">
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{run.title}</p>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
                <span>{fmtDate(run.completedAt)}</span>
                <span aria-hidden>·</span>
                <span>{run.mode === 'timed' ? 'Timed' : 'With explanations'}</span>
                <span aria-hidden>·</span>
                <span className="font-semibold text-fg tabular-nums">
                  {run.correct}/{run.total} ({pct}%)
                </span>
                {badges.map((b) => (
                  <span
                    key={b}
                    className="rounded-full bg-accent-soft px-2 py-0.5 font-bold text-accent-ink"
                  >
                    {b}
                  </span>
                ))}
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              <Link
                href={historyHref(run)}
                className="inline-flex h-9 items-center rounded-[var(--radius)] border border-line-strong bg-surface px-3 text-xs font-semibold hover:border-accent"
              >
                View corrections
              </Link>
              {missedIds.length > 0 && (
                <Link
                  href={`/exam/custom?ids=${missedIds.slice(0, 60).join(',')}&mode=tutor`}
                  className="inline-flex h-9 items-center rounded-[var(--radius)] bg-accent px-3 text-xs font-bold text-accent-fg"
                >
                  Retry {missedIds.length} missed
                </Link>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
