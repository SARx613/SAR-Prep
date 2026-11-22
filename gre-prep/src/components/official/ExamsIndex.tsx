'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, ClipboardCheck, Clock, History } from 'lucide-react';
import type { ExamHistoryEntry, ExamMeta } from '@/types/official';
import { HISTORY_KEY, applyErrata, parseLocalHistory, runKey } from '@/lib/official-storage';
import { useLocalString } from '@/lib/local-store';

/* The list of full-length tests, with the scores of past attempts.
 *
 * History is kept in this browser. A test left unfinished is flagged so it can
 * be resumed. */

const dateFmt = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' });

export function ExamsIndex({ exams }: { exams: ExamMeta[] }) {
  const rawLocal = useLocalString(HISTORY_KEY);
  const history = useMemo<ExamHistoryEntry[]>(
    () => parseLocalHistory(rawLocal).map((h, i) => ({ id: `local-${i}`, ...h })),
    [rawLocal],
  );
  // Rescore saved results affected by a question corrected since (official-errata.ts).
  useEffect(() => {
    for (const e of exams) void applyErrata(e.id);
  }, [exams]);

  const tests = exams.filter((e) => e.kind === 'test');
  const sets = exams.filter((e) => e.kind === 'set');
  const groups = sets.reduce<Record<string, ExamMeta[]>>((acc, e) => {
    (acc[e.group ?? 'Practice sets'] ??= []).push(e);
    return acc;
  }, {});
  const title = (id: string) => exams.find((e) => e.id === id)?.title ?? id;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 pb-10 sm:px-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
        <div>
          <Link
            href="/"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <h1 className="flex items-center gap-2.5 text-3xl font-bold">
            <ClipboardCheck className="h-7 w-7 text-good" />
            Official tests
          </h1>
          <p className="mt-2 text-muted">
            ETS’s own questions, run like the computer-delivered exam: a clock per section, Mark and Review, calculator, then a full answer review with the official explanations.
          </p>
        </div>

        <section className="space-y-4">
          <h2 className="text-sm uppercase tracking-wide text-faint">Full-length tests</h2>
          {tests.map((e) => {
            const minutes = e.sections.reduce((a, s) => a + s.minutes, 0);
            const questions = e.sections.reduce((a, s) => a + (s.kind === 'verbal' || s.kind === 'quant' ? s.questions : 0), 0);
            const last = history.find((h) => h.examId === e.id);
            return (
              <ExamCard key={e.id} exam={e} minutes={minutes} questions={questions} last={last} />
            );
          })}
        </section>

        {Object.entries(groups).map(([group, list]) => (
          <section key={group} className="space-y-3">
            <h2 className="text-sm uppercase tracking-wide text-faint">{group}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {list.map((e) => (
                <SetCard key={e.id} exam={e} last={history.find((h) => h.examId === e.id)} />
              ))}
            </div>
          </section>
        ))}

        {history.length > 0 && (
          <section className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm uppercase tracking-wide text-faint">
              <History className="h-4 w-4" /> History
            </h2>
            <div className="overflow-hidden rounded-2xl border border-line">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-sm last:border-0"
                >
                  <span className="min-w-0">
                    {title(h.examId)}
                    <span className="ml-2 text-faint">{dateFmt.format(new Date(h.completedAt))}</span>
                  </span>
                  <ScoreText entry={h} />
                </div>
              ))}
            </div>
          </section>
        )}
    </div>
  );
}

const LEVEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' } as const;

function ScoreText({ entry }: { entry: ExamHistoryEntry }) {
  if (entry.verbal === null && entry.quant === null) {
    return (
      <span className="shrink-0 tabular-nums">
        {entry.correct ?? 0} / {entry.total ?? 0}
      </span>
    );
  }
  return (
    <span className="shrink-0 tabular-nums">
      {entry.verbal !== null && <span className="text-accent-ink">V {entry.verbal}</span>}
      {entry.verbal !== null && entry.quant !== null && <span className="mx-2 text-faint">·</span>}
      {entry.quant !== null && <span className="text-good">Q {entry.quant}</span>}
    </span>
  );
}

function useInProgress(id: string): boolean {
  const raw = useLocalString(runKey(id));
  return useMemo(() => {
    try {
      return !!raw && (JSON.parse(raw) as { phase?: string }).phase !== 'done';
    } catch {
      return false;
    }
  }, [raw]);
}

function SetCard({ exam, last }: { exam: ExamMeta; last?: ExamHistoryEntry }) {
  const inProgress = useInProgress(exam.id);
  const s = exam.sections[0];
  return (
    <Link
      href={`/official-test/${exam.id}`}
      className="group flex items-start justify-between gap-3 rounded-2xl border border-line bg-surface p-4 transition hover:border-line-strong hover:bg-surface-2"
    >
      <div className="min-w-0 space-y-1">
        <h3 className="font-semibold">{exam.title}</h3>
        <p className="flex flex-wrap gap-x-3 text-sm text-muted">
          <span>{s?.kind === 'quant' ? 'Quant' : 'Verbal'}</span>
          <span>{s?.questions ?? 0} q.</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {s?.minutes ?? 0} min
          </span>
          {exam.level && <span>{LEVEL[exam.level]}</span>}
        </p>
        {inProgress && <span className="text-xs text-warn">In progress — resume</span>}
        {last && !inProgress && (
          <p className="text-sm">
            Last: <span className="font-semibold">{last.correct ?? 0} / {last.total ?? 0}</span>
            <span className="ml-1.5 text-faint">{dateFmt.format(new Date(last.completedAt))}</span>
          </p>
        )}
      </div>
      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-fg" />
    </Link>
  );
}

function ExamCard({
  exam, minutes, questions, last,
}: {
  exam: ExamMeta;
  minutes: number;
  questions: number;
  last?: ExamHistoryEntry;
}) {
  const inProgress = useInProgress(exam.id);

  return (
    <Link
      href={`/official-test/${exam.id}`}
      className="group block rounded-2xl border border-line bg-surface p-5 transition hover:border-line-strong hover:bg-surface-2"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-xl font-bold">{exam.title}</h2>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {Math.floor(minutes / 60)} h {String(minutes % 60).padStart(2, '0')}
            </span>
            <span>2 writing tasks</span>
            <span>{questions} Verbal + Quant questions</span>
          </div>
          {inProgress && (
            <span className="inline-block rounded-md border border-warn bg-warn-soft px-2 py-0.5 text-xs text-warn">
              Test in progress — resume
            </span>
          )}
          {last && (
            <p className="text-sm">
              Last attempt ({dateFmt.format(new Date(last.completedAt))}): <ScoreText entry={last} />
            </p>
          )}
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-fg" />
      </div>
    </Link>
  );
}
