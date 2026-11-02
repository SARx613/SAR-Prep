'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronRight, ClipboardCheck, Clock, History } from 'lucide-react';
import type { ExamHistoryEntry, ExamMeta } from '@/types/official';
import { HISTORY_KEY, parseLocalHistory, runKey } from '@/lib/official-storage';
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
            The two full-length tests of the ETS Official Guide, run like the computer-delivered exam: a clock per section, Mark and Review, calculator, break, then a 130–170 score with a full answer review.
          </p>
        </div>

        <div className="space-y-4">
          {exams.map((e) => {
            const minutes = e.sections.reduce((a, s) => a + s.minutes, 0);
            const questions = e.sections.reduce((a, s) => a + (s.kind === 'verbal' || s.kind === 'quant' ? s.questions : 0), 0);
            const last = history.find((h) => h.examId === e.id);
            return (
              <ExamCard key={e.id} exam={e} minutes={minutes} questions={questions} last={last} />
            );
          })}
        </div>

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
                  <span>
                    {exams.find((e) => e.id === h.examId)?.title ?? h.examId}
                    <span className="ml-2 text-faint">{dateFmt.format(new Date(h.completedAt))}</span>
                  </span>
                  <span className="tabular-nums">
                    <span className="text-accent-ink">V {h.verbal}</span>
                    <span className="mx-2 text-faint">·</span>
                    <span className="text-good">Q {h.quant}</span>
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}
    </div>
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
  const raw = useLocalString(runKey(exam.id));
  const inProgress = useMemo(() => {
    try {
      return !!raw && (JSON.parse(raw) as { phase?: string }).phase !== 'done';
    } catch {
      return false;
    }
  }, [raw]);

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
              Last attempt ({dateFmt.format(new Date(last.completedAt))}): 
              <span className="font-semibold text-accent-ink">Verbal {last.verbal}</span> ·{' '}
              <span className="font-semibold text-good">Quant {last.quant}</span>
            </p>
          )}
        </div>
        <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-faint transition group-hover:translate-x-0.5 group-hover:text-fg" />
      </div>
    </Link>
  );
}
