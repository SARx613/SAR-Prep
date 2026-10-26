'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAttempts, lessonStats } from '@/hooks/useAttempts';
import { useExamDate, useWeeklyHours } from '@/hooks/usePrefs';
import { useLocalValue } from '@/hooks/useLocalValue';
import { MOCKS_KEY, MOCK_COUNT, NO_MOCKS, parseMocks } from '@/lib/mock';
import { buildPlan, type PlanLesson } from '@/lib/plan';

export interface PlanSource { id: string; chapter: string; title: string; readMinutes: number; qCount: number; qSeconds: number }

export function PlanPanel({ lessons }: { lessons: PlanSource[] }) {
  const attempts = useAttempts();
  const examDate = useExamDate();
  const hours = useWeeklyHours();
  const mocks = useLocalValue(MOCKS_KEY, parseMocks, NO_MOCKS);
  const [now] = useState(() => new Date());

  const plan = useMemo(() => {
    if (!examDate || !hours) return null;
    const planLessons: PlanLesson[] = lessons.map((l) => {
      const st = lessonStats(attempts, l.id);
      const started = st.attempted > 0;
      const perQ = l.qCount ? l.qSeconds / l.qCount / 60 : 1;
      const left = Math.max(0, l.qCount - st.mastered) * perQ;
      return { id: l.id, chapter: l.chapter, title: l.title, minutes: l.readMinutes, remainingMinutes: Math.ceil((started ? 0 : l.readMinutes) + left) };
    });
    const diag = mocks.diag?.byChapter;
    const weak = diag ? Object.entries(diag).filter(([, v]) => v.n > 0).sort((a, b) => a[1].c / a[1].n - b[1].c / b[1].n).map(([k]) => k) : [];
    const mocksDone = Array.from({ length: MOCK_COUNT }, (_, i) => mocks[`m${i + 1}`]).filter((r) => r?.verbal2 && r?.quant2).length;
    return buildPlan({ lessons: planLessons, weakChapters: weak, examDate: new Date(examDate), hoursPerWeek: hours, now, mocksDone, mockCount: MOCK_COUNT });
  }, [attempts, examDate, hours, mocks, lessons, now]);

  if (!examDate || !hours) {
    return (
      <div className="rounded-[var(--radius)] border border-line bg-surface p-5">
        <p className="text-muted">Tell us your test date and how many hours a week you can study, and we’ll lay out the weeks.</p>
        <Link href="/settings" className="mt-4 inline-flex h-11 items-center rounded-[var(--radius)] bg-accent px-5 text-sm font-bold text-accent-fg">Set them in Settings</Link>
      </div>
    );
  }
  return (
    <ol className="space-y-4">
      {plan!.map((w) => (
        <li key={w.index} className="rounded-[var(--radius)] border border-line bg-surface p-4">
          <div className="flex items-baseline justify-between"><h2 className="font-bold">Week {w.index}</h2><span className="text-xs text-muted">{w.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} · {(w.minutes / 60).toFixed(1)} h</span></div>
          {w.items.length === 0 ? <p className="mt-2 text-sm text-muted">Review week — redo missed questions and vocabulary.</p> : (
            <ul className="mt-2 divide-y divide-line">
              {w.items.map((it) => (
                <li key={it.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${it.kind === 'mock' ? 'bg-warn-soft text-warn' : 'bg-accent-soft text-accent-ink'}`}>{it.kind === 'mock' ? 'Mock' : 'Lesson'}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{it.title}</span><span className="tabular-nums text-muted">{it.minutes} min</span>
                  {it.kind === 'lesson' ? <Link href={`/learn/${it.id.split('-')[0]}/${it.id}`} className="font-semibold text-accent-ink hover:underline">Open</Link> : <Link href="/mock" className="font-semibold text-accent-ink hover:underline">Open</Link>}
                </li>
              ))}
            </ul>
          )}
        </li>
      ))}
    </ol>
  );
}
