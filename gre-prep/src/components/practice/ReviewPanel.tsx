'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Repeat } from 'lucide-react';
import { useAttempts } from '@/hooks/useAttempts';
import { useReasons } from '@/hooks/usePrefs';
import { REASON_LABEL } from '@/lib/prefs';
import { buildQueue } from '@/lib/srs';
import { loadProgress } from '@/lib/storage';

export function ReviewPanel({ titles }: { titles: Record<string, string> }) {
  const attempts = useAttempts();
  const reasons = useReasons();
  const [now] = useState(() => Date.now());
  const q = useMemo(() => buildQueue(attempts, now), [attempts, now]);
  const words = typeof window !== 'undefined' ? loadProgress().reviewIds.length : 0;

  const missed = useMemo(() => {
    const last = new Map<string, (typeof attempts)[number]>();
    for (const a of attempts) if (a.mode !== 'check') last.set(a.qid, a);
    return [...last.values()].filter((a) => !a.correct).sort((a, b) => b.ts - a.ts);
  }, [attempts]);

  const dueIds = q.due.slice(0, 20).map((d) => d.qid);
  const rel = (ts: number) => {
    const d = Math.round((ts - now) / 86_400_000);
    return d <= 0 ? 'now' : d === 1 ? 'tomorrow' : `in ${d} days`;
  };

  return (
    <div className="space-y-10">
      <section aria-labelledby="due" className="rounded-[var(--radius)] border border-line bg-surface p-5">
        <h2 id="due" className="flex items-center gap-2 text-lg font-bold"><Repeat size={18} aria-hidden />Due today</h2>
        {q.due.length > 0 ? (
          <>
            <p className="mt-1 text-sm text-muted">{q.due.length} question{q.due.length > 1 ? 's' : ''} you missed are ready for another try.</p>
            <Link href={`/exam/custom?ids=${dueIds.join(',')}&mode=tutor`} className="mt-4 inline-flex h-11 items-center rounded-[var(--radius)] bg-accent px-5 text-sm font-bold text-accent-fg">Review {dueIds.length}</Link>
          </>
        ) : (
          <p className="mt-1 text-sm text-muted">Nothing due.{q.upcoming[0] ? ` Next review ${rel(q.upcoming[0].dueAt)}.` : ' Questions you miss will come back here on a schedule.'}</p>
        )}
        <p className="mt-3 text-xs text-faint">{q.upcoming.length} scheduled · {q.retired} mastered after review</p>
      </section>

      <section aria-labelledby="vocab" className="rounded-[var(--radius)] border border-line bg-surface p-5">
        <h2 id="vocab" className="text-lg font-bold">Vocabulary</h2>
        <p className="mt-1 text-sm text-muted">{words > 0 ? `${words} word${words > 1 ? 's' : ''} waiting for a repeat.` : 'No missed words right now.'}</p>
        {words > 0 && <Link href="/games/review" className="mt-4 inline-flex h-11 items-center rounded-[var(--radius)] border border-line-strong px-5 text-sm font-semibold">Review words</Link>}
      </section>

      <section aria-labelledby="log">
        <h2 id="log" className="text-lg font-bold">Error log</h2>
        {missed.length === 0 ? (
          <p className="mt-1 text-sm text-muted">No open misses. Nice.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[var(--radius)] border border-line bg-surface">
            {missed.slice(0, 50).map((a) => (
              <li key={a.qid} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-sm">
                <span className="font-semibold">{a.type}</span>
                <span className="text-muted">{titles[a.lessonId] ?? a.lessonId}</span>
                <span className="text-faint">d{a.difficulty}</span>
                {reasons[a.qid] && <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">{REASON_LABEL[reasons[a.qid]]}</span>}
                <Link href={`/exam/custom?ids=${a.qid}&mode=tutor`} className="ml-auto font-semibold text-accent-ink hover:underline">Retry</Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
