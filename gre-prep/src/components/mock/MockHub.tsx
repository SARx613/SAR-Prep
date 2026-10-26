'use client';

import Link from 'next/link';
import { Check, Play } from 'lucide-react';
import { useLocalValue } from '@/hooks/useLocalValue';
import { MOCKS_KEY, MOCK_COUNT, NO_MOCKS, SECTION_MINUTES, parseMocks, sectionEstimate, type MockRecord, type Section } from '@/lib/mock';

const card = 'rounded-[var(--radius)] border border-line bg-surface p-4';
const btn = 'inline-flex h-10 items-center gap-1.5 rounded-[var(--radius)] px-4 text-sm font-semibold';

function SectionRow({ kind, section, rec }: { kind: string; section: Section; rec?: MockRecord }) {
  const a = rec?.[`${section}1`], b = rec?.[`${section}2`];
  const est = sectionEstimate(rec, section);
  const label = section === 'verbal' ? 'Verbal' : 'Quant';
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <span className="w-16 font-semibold">{label}</span>
      <span className="text-sm text-muted">{SECTION_MINUTES[section][1]} + {SECTION_MINUTES[section][2]} min</span>
      <span className="ml-auto flex flex-wrap items-center gap-2">
        {est ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-good-soft px-3 py-1 text-sm font-bold text-good"><Check size={14} aria-hidden />≈ {est.mid} <span className="font-medium opacity-80">({est.low}–{est.high})</span></span>
        ) : a ? (
          <Link href={`/mock/run/${kind}/${section}/2?level=${b?.level ?? (a.correct / a.total >= 0.7 ? 'hard' : a.correct / a.total >= 0.4 ? 'medium' : 'easy')}`} className={`${btn} bg-accent text-accent-fg`}><Play size={15} aria-hidden />Continue to section 2</Link>
        ) : (
          <Link href={`/mock/run/${kind}/${section}/1`} className={`${btn} border border-line-strong`}><Play size={15} aria-hidden />Start</Link>
        )}
      </span>
    </div>
  );
}

export function MockHub() {
  const store = useLocalValue(MOCKS_KEY, parseMocks, NO_MOCKS);
  const diag = store.diag;
  return (
    <div className="space-y-6">
      <section className={card} aria-labelledby="diag">
        <h2 id="diag" className="text-lg font-bold">Diagnostic</h2>
        <p className="mt-1 text-sm text-muted">About 40 minutes, one question or passage from each core chapter. Shows your starting level and sets your study plan’s priorities.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link href="/mock/run/diag/all/1" className={`${btn} bg-accent text-accent-fg`}><Play size={15} aria-hidden />{diag?.byChapter ? 'Retake' : 'Start'} diagnostic</Link>
          {diag?.byChapter && <span className="text-sm text-muted">Last result: {Object.values(diag.byChapter).reduce((a, x) => a + x.c, 0)}/{Object.values(diag.byChapter).reduce((a, x) => a + x.n, 0)} correct.</span>}
        </div>
      </section>

      <p className="rounded-[var(--radius)] bg-warn-soft px-4 py-3 text-sm text-warn">
        Scores here are <strong>estimates</strong> from this app’s own questions, not official ETS scores. Section 2 gets easier or harder depending on section 1, as on the real test.
      </p>

      {Array.from({ length: MOCK_COUNT }, (_, i) => {
        const kind = `m${i + 1}`;
        const rec = store[kind];
        const v = sectionEstimate(rec, 'verbal'), q = sectionEstimate(rec, 'quant');
        return (
          <section key={kind} className={card} aria-labelledby={kind}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 id={kind} className="text-lg font-bold">Mock test {i + 1}</h2>
              {v && q && <span className="text-sm font-bold text-accent-ink">Total ≈ {v.mid + q.mid}</span>}
            </div>
            <div className="mt-1 divide-y divide-line">
              <SectionRow kind={kind} section="verbal" rec={rec} />
              <SectionRow kind={kind} section="quant" rec={rec} />
            </div>
          </section>
        );
      })}
    </div>
  );
}
