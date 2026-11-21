'use client';

import Link from 'next/link';
import { Check, ChevronDown, Play, RotateCcw } from 'lucide-react';
import { useLocalValue } from '@/hooks/useLocalValue';
import { MOCK_CONVERSION_27, etsPercentile, ordinal } from '@/lib/gre-score';
import { MOCKS_KEY, MOCK_COUNT, NO_MOCKS, SECTION_MINUTES, mockLabel, parseMocks, sectionEstimate, type MockRecord, type MockStore, type Section } from '@/lib/mock';

const card = 'rounded-[var(--radius)] border border-line bg-surface p-4';
const btn = 'inline-flex h-10 items-center gap-1.5 rounded-[var(--radius)] px-4 text-sm font-semibold';

function SectionRow({ kind, section, rec }: { kind: string; section: Section; rec?: MockRecord }) {
  const a = rec?.[`${section}1`], b = rec?.[`${section}2`];
  const est = sectionEstimate(rec, section);
  const label = section === 'verbal' ? 'Verbal' : 'Quant';
  const s2Label = b?.level === 'easy' ? 'Easy' : b?.level === 'medium' ? 'Medium' : 'Hard';

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          <span className="w-16 font-semibold">{label}</span>
          <span className="text-sm text-muted">{SECTION_MINUTES[section][1]} + {SECTION_MINUTES[section][2]} min</span>
        </div>
        {est && a && b && (
          <p className="mt-1 text-xs text-muted">
            {a.correct + b.correct}/{a.total + b.total} correct (S1: {a.correct}/{a.total}, S2 {s2Label}: {b.correct}/{b.total})
          </p>
        )}
      </div>
      <span className="ml-auto flex flex-wrap items-center gap-2">
        {est && a && b ? (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-good-soft px-3 py-1 text-sm font-bold text-good">
              <Check size={14} aria-hidden />
              {est.scaled} / 170 · {ordinal(est.percentile)} percentile
            </span>
            <Link href={`/mock/review/${kind}/${section}?level=${b.level ?? 'hard'}`} className={`${btn} border border-line-strong hover:border-accent`}>
              View corrections
            </Link>
            <Link href={`/mock/run/${kind}/${section}/1`} className={`${btn} border border-line-strong text-muted hover:text-fg`}>
              <RotateCcw size={14} aria-hidden />
              Retake
            </Link>
          </>
        ) : a ? (
          <>
            <span className="text-xs font-medium text-muted">S1: {a.correct}/{a.total}</span>
            <Link href={`/mock/run/${kind}/${section}/2?level=hard`} className={`${btn} bg-accent text-accent-fg`}>
              <Play size={15} aria-hidden />
              Continue to section 2 (Hard)
            </Link>
          </>
        ) : (
          <Link href={`/mock/run/${kind}/${section}/1`} className={`${btn} border border-line-strong hover:border-accent`}>
            <Play size={15} aria-hidden />
            Start
          </Link>
        )}
      </span>
    </div>
  );
}

function MockCard({ kind, store, badge }: { kind: string; store: MockStore; badge?: string }) {
  const rec = store[kind];
  const v = sectionEstimate(rec, 'verbal'), q = sectionEstimate(rec, 'quant');
  return (
    <section className={card} aria-labelledby={kind}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={kind} className="flex flex-wrap items-center gap-2 text-lg font-bold">
          {mockLabel(kind)}
          {badge && <span className="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-bold text-accent-ink">{badge}</span>}
        </h2>
        {v && q && (
          <span className="text-sm font-bold text-accent-ink">
            Total: {v.scaled + q.scaled} / 340 <span className="font-medium text-muted">(V {v.scaled} · Q {q.scaled})</span>
          </span>
        )}
      </div>
      <div className="mt-1 divide-y divide-line">
        <SectionRow kind={kind} section="verbal" rec={rec} />
        <SectionRow kind={kind} section="quant" rec={rec} />
      </div>
    </section>
  );
}

export function MockHub({ examIds = [] }: { examIds?: string[] }) {
  const store = useLocalValue(MOCKS_KEY, parseMocks, NO_MOCKS);
  const diag = store.diag;
  const diagTotalCorrect = diag?.byChapter ? Object.values(diag.byChapter).reduce((a, x) => a + x.c, 0) : 0;
  const diagTotalCount = diag?.byChapter ? Object.values(diag.byChapter).reduce((a, x) => a + x.n, 0) : 0;

  return (
    <div className="space-y-6">
      <section className={card} aria-labelledby="diag">
        <h2 id="diag" className="text-lg font-bold">Diagnostic</h2>
        <p className="mt-1 text-sm text-muted">About 40 minutes, one question or passage from each core chapter. Shows your starting level and sets your study plan’s priorities.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link href="/mock/run/diag/all/1" className={`${btn} bg-accent text-accent-fg`}>
            <Play size={15} aria-hidden />
            {diag?.byChapter ? 'Retake' : 'Start'} diagnostic
          </Link>
          {diag?.byChapter && (
            <span className="text-sm text-muted">
              Last result: {diagTotalCorrect}/{diagTotalCount} correct.
            </span>
          )}
          {diag?.diagScore && (diag.diagScore.verbal || diag.diagScore.quant) && (
            <span className="inline-flex flex-wrap items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent-ink">
              {diag.diagScore.verbal && (
                <span>
                  Verbal {diag.diagScore.verbal.scaled} ({ordinal(diag.diagScore.verbal.percentile)} %ile)
                </span>
              )}
              {diag.diagScore.verbal && diag.diagScore.quant && <span aria-hidden>·</span>}
              {diag.diagScore.quant && (
                <span>
                  Quant {diag.diagScore.quant.scaled} ({ordinal(diag.diagScore.quant.percentile)} %ile)
                </span>
              )}
            </span>
          )}
        </div>
      </section>

      <p className="rounded-[var(--radius)] bg-warn-soft px-4 py-3 text-sm text-warn">
        Section 2 always routes to the <strong>Hard module (levels 4–5)</strong> across all mock tests. Scores are exact on our PDF-calibrated 0–27 → 130–170 scale (indicative of ETS scoring, not an official ETS score report).
      </p>

      {examIds.length > 0 && (
        <>
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Exam-style tests</h2>
            <p className="mt-1 max-w-prose text-sm text-muted">
              Built like the real test, with questions written only for these tests: you will not find them in practice, chapter tests or the question bank.
              Real question order (Text Completion, then Reading, Sentence Equivalence, more Reading; Quantitative Comparison first in Quant), real timing,
              section 1 of average difficulty and a hard section 2.
            </p>
          </div>
          {examIds.map((kind) => <MockCard key={kind} kind={kind} store={store} badge="New questions" />)}
          <h2 className="pt-2 text-xl font-extrabold tracking-tight">Practice-bank mocks</h2>
          <p className="-mt-4 max-w-prose text-sm text-muted">Generated from the practice bank, so you may have seen some of these questions already.</p>
        </>
      )}

      {Array.from({ length: MOCK_COUNT }, (_, i) => <MockCard key={`m${i + 1}`} kind={`m${i + 1}`} store={store} />)}

      <details className={card}>
        <summary className="flex cursor-pointer list-none items-center justify-between gap-2 font-semibold">
          <span>Exact Mock Score Conversion Table (0–27 correct → 130–170 & ETS Percentile)</span>
          <ChevronDown size={16} className="shrink-0 text-muted" aria-hidden />
        </summary>
        <p className="mt-2 text-sm text-muted">
          Defined scoring table for the 27-question structure (12 average + 15 Hard Section 2), calibrated to the ETS Official Guide conversion curve and ETS percentile ranks.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[420px] text-left text-xs tabular-nums">
            <thead>
              <tr className="border-b border-line text-faint">
                <th className="py-2 pr-3 font-bold uppercase">Raw / 27</th>
                <th className="py-2 pr-3 font-bold uppercase">Verbal Score</th>
                <th className="py-2 pr-3 font-bold uppercase">Verbal %ile</th>
                <th className="py-2 pr-3 font-bold uppercase">Quant Score</th>
                <th className="py-2 font-bold uppercase">Quant %ile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {Array.from({ length: 28 }, (_, idx) => 27 - idx).map((raw) => {
                const vs = MOCK_CONVERSION_27.verbal.hard[raw];
                const qs = MOCK_CONVERSION_27.quant.hard[raw];
                return (
                  <tr key={raw}>
                    <td className="py-1.5 pr-3 font-semibold">{raw}</td>
                    <td className="py-1.5 pr-3 font-bold text-accent-ink">{vs}</td>
                    <td className="py-1.5 pr-3 text-muted">{ordinal(etsPercentile('verbal', vs))}</td>
                    <td className="py-1.5 pr-3 font-bold text-good">{qs}</td>
                    <td className="py-1.5 text-muted">{ordinal(etsPercentile('quant', qs))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
