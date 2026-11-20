'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { fetchQuestionsByIds } from '@/app/actions/questions';
import { useCloudSyncStatus } from '@/components/CloudSync';
import type { ClientQuestion } from '@/content/types';
import { useLocalValue } from '@/hooks/useLocalValue';
import { grade as gradeQuestion } from '@/lib/grading';
import { NO_RUNS, RUN_HISTORY_KEY, parseRuns } from '@/lib/run-history';
import { ExamPlayer, type PlayerResult } from './ExamPlayer';
import { toResponse } from './selection';

export function HistoryRunViewer({
  runId,
  initialQuestions,
}: {
  runId: string;
  initialQuestions: ClientQuestion[];
}) {
  const router = useRouter();
  const cloudSync = useCloudSyncStatus();
  const runs = useLocalValue(RUN_HISTORY_KEY, parseRuns, NO_RUNS);
  const run = useMemo(() => runs.find((r) => r.id === runId), [runs, runId]);
  const [fetched, setFetched] = useState<ClientQuestion[]>([]);

  const knownIds = useMemo(() => new Set(initialQuestions.map((q) => q.id)), [initialQuestions]);
  const missingIds = useMemo(() => {
    if (!run) return [];
    return run.items.map((i) => i.qid).filter((id) => !knownIds.has(id));
  }, [run, knownIds]);

  useEffect(() => {
    if (missingIds.length === 0) return;
    let cancelled = false;
    fetchQuestionsByIds(run!.items.map((i) => i.qid))
      .then((qs) => {
        if (!cancelled) setFetched(qs);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [missingIds.length, run]);

  const questions = useMemo(() => {
    const map = new Map<string, ClientQuestion>();
    for (const q of initialQuestions) map.set(q.id, q);
    for (const q of fetched) map.set(q.id, q);
    return map;
  }, [initialQuestions, fetched]);

  const reconstructed: PlayerResult[] = useMemo(() => {
    if (!run) return [];
    return run.items.flatMap((it) => {
      const q = questions.get(it.qid);
      if (!q) return [];
      const grade = gradeQuestion(q, toResponse(q, it.sel));
      return [{ q, sel: it.sel, grade, ms: it.ms }];
    });
  }, [run, questions]);

  if (!run) {
    const syncing = cloudSync.authenticated && cloudSync.state === 'syncing';
    return (
      <div className="exam min-h-dvh">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          {syncing ? (
            <div className="space-y-3">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-accent-ink" />
              <p className="text-sm text-muted">Loading saved series from your Google account…</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h1 className="text-xl font-bold">Saved series not found</h1>
              <p className="text-sm text-muted">
                This result may be saved on another account or cleared from this browser.
              </p>
              <Link
                href="/review#history"
                className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius)] border border-line-strong bg-surface px-4 text-sm font-semibold hover:bg-surface-2"
              >
                <ArrowLeft size={15} aria-hidden /> Back to review history
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (reconstructed.length === 0) {
    return (
      <div className="exam min-h-dvh">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <Loader2 className="mx-auto h-7 w-7 animate-spin text-accent-ink" />
          <p className="mt-3 text-sm text-muted">Loading questions and explanations…</p>
        </div>
      </div>
    );
  }

  return (
    <ExamPlayer
      key={run.id}
      title={run.title}
      questions={reconstructed.map((r) => r.q)}
      mode={run.mode}
      backHref="/review#history"
      setId={run.setId}
      runKind={run.kind}
      mockSummary={
        run.mockScore
          ? {
              section: run.mockScore.section,
              part1Correct: run.mockScore.part1Correct,
              part1Total: run.mockScore.part1Total,
              level: run.mockScore.level,
            }
          : undefined
      }
      initialResults={reconstructed}
      completedAt={run.completedAt}
      onRetryMissed={(missedIds) => router.push(`/exam/custom?ids=${missedIds.join(',')}&mode=tutor`)}
      onRetakeAll={() => router.push(`/exam/custom?ids=${run.items.map((i) => i.qid).join(',')}&mode=${run.mode}`)}
    />
  );
}
