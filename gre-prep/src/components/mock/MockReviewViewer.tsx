'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useCloudSyncStatus } from '@/components/CloudSync';
import { ExamPlayer } from '@/components/exam/ExamPlayer';
import type { ClientQuestion } from '@/content/types';
import { useAttempts } from '@/hooks/useAttempts';
import { useLocalValue } from '@/hooks/useLocalValue';
import { MOCKS_KEY, NO_MOCKS, parseMocks, type Level, type Section } from '@/lib/mock';
import { reconstructPartResults } from '@/lib/mock-review';
import { NO_RUNS, RUN_HISTORY_KEY, parseRuns } from '@/lib/run-history';

export function MockReviewViewer({
  kind,
  mockNum,
  section,
  level,
  part1Questions,
  part2Questions,
}: {
  kind: string;
  mockNum: number;
  section: Section;
  level: Level;
  part1Questions: ClientQuestion[];
  part2Questions: ClientQuestion[];
}) {
  const router = useRouter();
  const cloudSync = useCloudSyncStatus();
  const mocks = useLocalValue(MOCKS_KEY, parseMocks, NO_MOCKS);
  const runs = useLocalValue(RUN_HISTORY_KEY, parseRuns, NO_RUNS);
  const attempts = useAttempts();

  const rec = mocks[kind];
  const part1 = rec?.[`${section}1`];
  const part2 = rec?.[`${section}2`];
  const matchingRun = useMemo(
    () => runs.find((r) => r.setId === `mock:${kind}:${section}:2`),
    [runs, kind, section],
  );

  const allResults = useMemo(() => {
    const p1 = reconstructPartResults(part1Questions, part1?.items ?? matchingRun?.items, attempts);
    const p2 = reconstructPartResults(part2Questions, part2?.items ?? matchingRun?.items, attempts);
    return [...p1, ...p2];
  }, [part1Questions, part2Questions, part1?.items, part2?.items, matchingRun?.items, attempts]);

  if (!part1 && !part2 && !matchingRun) {
    const syncing = cloudSync.authenticated && cloudSync.state === 'syncing';
    return (
      <div className="exam min-h-dvh">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          {syncing ? (
            <div className="space-y-3">
              <Loader2 className="mx-auto h-7 w-7 animate-spin text-accent-ink" />
              <p className="text-sm text-muted">Loading mock test results from your Google account…</p>
            </div>
          ) : (
            <div className="space-y-4">
              <h1 className="text-xl font-bold">
                Mock {mockNum} · {section === 'verbal' ? 'Verbal' : 'Quant'} not completed yet
              </h1>
              <p className="text-sm text-muted">
                Complete this mock section first to review all 27 questions and explanations.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/mock"
                  className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius)] border border-line-strong bg-surface px-4 text-sm font-semibold hover:bg-surface-2"
                >
                  <ArrowLeft size={15} aria-hidden /> Back to mock tests
                </Link>
                <Link
                  href={`/mock/run/${kind}/${section}/1`}
                  className="inline-flex h-10 items-center rounded-[var(--radius)] bg-accent px-4 text-sm font-bold text-accent-fg"
                >
                  Start section 1
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <ExamPlayer
      key={`${kind}-${section}-${allResults.length}`}
      title={`Mock ${mockNum} · ${section === 'verbal' ? 'Verbal' : 'Quant'} (Sections 1 & 2)`}
      questions={allResults.map((r) => r.q)}
      mode="timed"
      backHref="/mock"
      setId={`mock:${kind}:${section}:2`}
      runKind="mock"
      mockSummary={{
        section,
        part1Correct: part1?.correct ?? part1Questions.length,
        part1Total: part1?.total ?? part1Questions.length,
        level: part2?.level ?? level,
      }}
      initialResults={allResults}
      completedAt={part2?.ts ?? matchingRun?.completedAt}
      onRetryMissed={(missedIds) => router.push(`/exam/custom?ids=${missedIds.join(',')}&mode=tutor`)}
      onRetakeAll={() => router.push(`/mock/run/${kind}/${section}/1`)}
    />
  );
}
