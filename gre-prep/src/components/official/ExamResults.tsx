'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, BookOpenCheck, CheckCircle2, ChevronDown, Lightbulb, PenLine, RotateCcw, XCircle,
} from 'lucide-react';
import type {
  Answer, ExamContent, ExamResult, ItemResult, QuantSection, SampleEssay, SectionResult, VerbalSection,
} from '@/types/official';
import type { FigureTheme } from '@/lib/figure-theme';
import { ExamImg, Paper } from './ExamImage';
import { Markup } from './Markup';
import { QuestionLayout } from './QuestionLayout';

/* The report after a test: scaled scores, then every question reviewable
 * with its key, its explanation and how real test takers fared on it. */

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

function minutes(ms?: number): string | null {
  if (!ms) return null;
  const s = Math.round(ms / 1000);
  return s >= 60 ? `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s` : `${s} s`;
}

function ScoreCard({
  label, scaled, raw, total, tone,
}: {
  label: string;
  scaled: number;
  raw: number;
  total: number;
  tone: string;
}) {
  return (
    <div className={cx('rounded-2xl border p-5', tone)}>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-5xl font-black tabular-nums">{scaled}</p>
      <p className="mt-1 text-sm text-muted">
        {raw} / {total} correct · 130–170 scale
      </p>
    </div>
  );
}

function ExplanationBlock({ item, theme }: { item: ItemResult; theme: FigureTheme }) {
  const ex = item.explanation;
  if (!ex) return null;
  return (
    <div className="space-y-3 rounded-2xl border border-warn bg-amber-500/[0.05] p-5">
      <p className="flex items-center gap-2 text-sm font-semibold text-warn">
        <Lightbulb className="h-4 w-4" /> Explanation
      </p>
      {Array.isArray(ex) ? (
        <div className="space-y-3 text-[15px] leading-relaxed text-fg/90">
          {ex.map((p, i) => (
            <p key={i}>
              <Markup text={p} />
            </p>
          ))}
        </div>
      ) : (
        <Paper theme={theme}>
          <ExamImg img={ex} />
        </Paper>
      )}
    </div>
  );
}

function SectionReview({
  section, result, answers, theme,
}: {
  section: VerbalSection | QuantSection;
  result: SectionResult;
  answers: Record<number, Answer>;
  theme: FigureTheme;
}) {
  const [sel, setSel] = useState<number | null>(null);
  const items = result.items ?? [];
  const current = items.find((i) => i.n === sel);
  const item = section.items.find((i) => i.n === sel);

  return (
    <section className="space-y-4 rounded-2xl border border-line bg-[var(--bg-card)]/50 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-bold">
          Section {section.number} · {section.title}
        </h3>
        <span className="font-semibold tabular-nums">
          {result.correct} / {result.total}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {items.map((i) => (
          <button
            key={i.n}
            onClick={() => setSel(sel === i.n ? null : i.n)}
            aria-label={`Question ${i.n}`}
            className={cx(
              'h-9 w-9 rounded-lg border text-sm font-semibold tabular-nums transition',
              i.correct && 'border-good bg-good-soft text-good hover:bg-good-soft',
              !i.correct && !i.skipped && 'border-bad bg-bad-soft text-bad hover:bg-bad-soft',
              i.skipped && 'border-dashed border-line-strong bg-surface-2 text-faint hover:bg-surface-2',
              sel === i.n && 'ring-2 ring-accent',
            )}
          >
            {i.n}
          </button>
        ))}
      </div>
      <p className="text-xs text-faint">
        <span className="text-good">green</span> correct · <span className="text-bad">red</span> wrong · dashed = not answered. Click a question to review it.
      </p>

      {current && item && (
        <div className="space-y-4 border-t border-line pt-4">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-1.5 font-semibold">
              {current.correct ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-good" /> Correct
                </>
              ) : current.skipped ? (
                <>
                  <XCircle className="h-4 w-4 text-faint" /> Not answered
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 text-bad" /> Wrong
                </>
              )}
            </span>
            <span className="text-muted">{current.p}% of test takers answered this question correctly</span>
            {minutes(current.timeMs) && (
              <span className="text-muted">Time spent: {minutes(current.timeMs)}</span>
            )}
          </div>
          <QuestionLayout
            section={section}
            item={item}
            answer={answers[item.n]}
            theme={theme}
            sticky={false}
            review={{ expected: current.expected, correct: current.correct, skipped: current.skipped }}
          />
          <ExplanationBlock item={current} theme={theme} />
        </div>
      )}
    </section>
  );
}

function SamplesList({ samples }: { samples: SampleEssay[] }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-2">
      {samples.map((s, i) => (
        <div key={s.score} className="overflow-hidden rounded-xl border border-line">
          <button
            onClick={() => setOpen(open === i ? null : i)}
            className="flex w-full items-center justify-between px-4 py-3 text-left font-medium transition hover:bg-surface-2"
          >
            <span>Sample response scored {s.score} / 6</span>
            <ChevronDown className={cx('h-4 w-4 transition', open === i && 'rotate-180')} />
          </button>
          {open === i && (
            <div className="space-y-4 border-t border-line px-4 py-4 text-[15px] leading-relaxed">
              <div className="space-y-3">
                {s.response.map((p, k) => (
                  <p key={k}>{p}</p>
                ))}
              </div>
              <div className="space-y-2 rounded-xl border border-accent bg-violet-500/[0.06] p-4">
                <p className="text-sm font-semibold text-accent-ink">Reader commentary</p>
                {s.commentary.map((p, k) => (
                  <p key={k} className="text-muted">{p}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function ExamResults({
  exam, result, answers, essays, onRetake,
}: {
  exam: ExamContent;
  result: ExamResult;
  answers: Record<string, Record<number, Answer>>;
  essays: Record<string, string>;
  onRetake: () => void;
}) {

  const theme: FigureTheme = 'paper';
  return (
    <main className="page">
      <div className="page-container max-w-5xl space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/official-tests"
              className="mb-5 inline-flex items-center gap-2 text-sm text-muted transition hover:text-fg"
            >
              <ArrowLeft className="h-4 w-4" /> Official tests
            </Link>
            <h1 className="flex items-center gap-2.5 text-3xl font-bold">
              <BookOpenCheck className="h-7 w-7 text-good" />
              Results — {exam.title}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (confirm('Erase these answers and retake the test?')) onRetake();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-accent bg-accent-soft px-4 py-2.5 text-sm font-medium transition hover:bg-accent-soft"
            >
              <RotateCcw className="h-4 w-4" /> Retake
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ScoreCard
            label="Verbal Reasoning"
            scaled={result.verbal.scaled}
            raw={result.verbal.raw}
            total={result.verbal.total}
            tone="border-accent bg-violet-500/[0.07]"
          />
          <ScoreCard
            label="Quantitative Reasoning"
            scaled={result.quant.scaled}
            raw={result.quant.raw}
            total={result.quant.total}
            tone="border-good bg-emerald-500/[0.07]"
          />
        </div>

        {exam.sections.map((s) => {
          const r = result.sections[s.id];
          if (s.kind === 'verbal' || s.kind === 'quant') {
            return (
              <SectionReview key={s.id} section={s} result={r} answers={answers[s.id] ?? {}} theme={theme} />
            );
          }
          return (
            <section key={s.id} className="space-y-4 rounded-2xl border border-line bg-[var(--bg-card)]/50 p-5">
              <h3 className="flex items-center gap-2 text-lg font-bold">
                <PenLine className="h-5 w-5 text-warn" />
                Section {s.number} · {s.title}
              </h3>
              <p className="text-sm text-muted">
                Writing is not scored automatically. Compare your response with the official sample responses scored 1–6, with the readers’ commentary.
              </p>
              <div className="rounded-xl border border-line bg-surface-2 p-4">
                <p className="mb-2 text-xs uppercase tracking-wide text-faint">
                  Your response · {r.essay?.words ?? 0} words
                </p>
                <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {essays[s.id]?.trim() || <span className="text-faint">No response written.</span>}
                </p>
              </div>
              {r.samples && <SamplesList samples={r.samples} />}
            </section>
          );
        })}
      </div>
    </main>
  );
}
