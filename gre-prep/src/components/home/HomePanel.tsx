'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, Flame, Layers, PenLine, Repeat, Timer } from 'lucide-react';
import { useAttempts } from '@/hooks/useAttempts';
import { useExamDate } from '@/hooks/usePrefs';
import { Bar } from '@/components/learn/Progress';
import { coverage, streak } from '@/lib/stats';
import { buildQueue } from '@/lib/srs';
import { loadProgress } from '@/lib/storage';

export interface HomeLesson { id: string; chapter: string; title: string; section: 'quant' | 'verbal' | 'writing' | 'test'; qids: string[] }

const card = 'rounded-[var(--radius)] border border-line bg-surface p-5';

export function HomePanel({ lessons, wordTotal }: { lessons: HomeLesson[]; wordTotal: number }) {
  const attempts = useAttempts();
  const examDate = useExamDate();
  const [now] = useState(() => Date.now());

  const data = useMemo(() => {
    const quant = lessons.filter((l) => l.section === 'quant').flatMap((l) => l.qids);
    const verbal = lessons.filter((l) => l.section === 'verbal').flatMap((l) => l.qids);
    const next = lessons.find((l) => l.qids.length > 0 && coverage(attempts, l.qids).done < l.qids.length) ?? null;
    return {
      quant: coverage(attempts, quant),
      verbal: coverage(attempts, verbal),
      next,
      nextDone: next ? coverage(attempts, next.qids).done : 0,
      due: buildQueue(attempts, now).due.length,
      streak: streak(attempts, now),
    };
  }, [attempts, lessons, now]);

  const words = typeof window !== 'undefined' ? loadProgress().masteredIds.length : 0;
  const daysLeft = examDate ? Math.ceil((new Date(examDate).getTime() - now) / 86_400_000) : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        {daysLeft !== null && daysLeft >= 0 && <span className="rounded-full bg-accent-soft px-3 py-1 font-semibold text-accent-ink">{daysLeft === 0 ? 'Test day!' : `${daysLeft} day${daysLeft > 1 ? 's' : ''} to your test`}</span>}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-warn-soft px-3 py-1 font-semibold text-warn"><Flame size={14} aria-hidden />{data.streak} day streak</span>
      </div>

      <section className={card} aria-labelledby="today">
        <h2 id="today" className="text-xs font-bold uppercase tracking-wide text-faint">Today</h2>
        {data.due > 0 ? (
          <Link href="/review" className="mt-2 flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-bad-soft text-bad"><Repeat size={20} aria-hidden /></span>
            <span className="flex-1"><span className="block text-lg font-bold">Review {data.due} missed question{data.due > 1 ? 's' : ''}</span><span className="text-sm text-muted">Spaced repetition: they’re due now.</span></span>
            <ArrowRight size={18} className="text-faint" aria-hidden />
          </Link>
        ) : data.next ? (
          <Link href={`/learn/${data.next.chapter}/${data.next.id}`} className="mt-2 flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent-ink"><ArrowRight size={20} aria-hidden /></span>
            <span className="flex-1"><span className="block text-lg font-bold">{data.nextDone > 0 ? 'Continue' : 'Start'}: {data.next.title}</span><span className="text-sm text-muted">{data.next.qids.length - data.nextDone} question{data.next.qids.length - data.nextDone === 1 ? '' : 's'} left</span></span>
            <ArrowRight size={18} className="text-faint" aria-hidden />
          </Link>
        ) : (
          <p className="mt-2 text-muted">Everything available is done. Take a mock test or review your stats.</p>
        )}
      </section>

      <section className={card} aria-labelledby="cov">
        <h2 id="cov" className="text-xs font-bold uppercase tracking-wide text-faint">Questions mastered</h2>
        <div className="mt-3 space-y-4">
          {([['Quantitative', data.quant], ['Verbal', data.verbal]] as const).map(([label, c]) => (
            <div key={label}>
              <div className="mb-1 flex justify-between text-sm"><span className="font-semibold">{label}</span><span className="text-muted">{c.accuracy === null ? '—' : `${Math.round(c.accuracy * 100)}% accuracy`}</span></div>
              <Bar value={c.done} max={c.total} label={`${label} questions mastered`} />
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/mock" className={`${card} flex items-center gap-3 hover:border-line-strong`}><Timer size={20} className="text-accent-ink" aria-hidden /><span className="font-semibold">Mock tests</span></Link>
        <Link href="/writing" className={`${card} flex items-center gap-3 hover:border-line-strong`}><PenLine size={20} className="text-accent-ink" aria-hidden /><span className="font-semibold">Writing</span></Link>
        <Link href="/flashcards" className={`${card} flex items-center gap-3 hover:border-line-strong`}><Layers size={20} className="text-accent-ink" aria-hidden /><span className="min-w-0"><span className="block font-semibold">Vocabulary</span><span className="text-xs text-muted">{words}/{wordTotal} words</span></span></Link>
      </div>
    </div>
  );
}
