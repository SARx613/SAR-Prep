'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useAttempts } from '@/hooks/useAttempts';
import { useReasons } from '@/hooks/usePrefs';
import { REASON_LABEL } from '@/lib/prefs';
import { activityByDay, latestByQuestion } from '@/lib/stats';

interface Props {
  lessons: { id: string; title: string; chapter: string; chapterTitle: string }[];
  /** Target seconds per question, from the content. */
  est: Record<string, number>;
}

const card = 'rounded-[var(--radius)] border border-line bg-surface p-5';
const pct = (n: number) => `${Math.round(n * 100)}%`;
const TYPE_LABEL: Record<string, string> = { QC: 'Quantitative Comparison', PS: 'Problem Solving', NE: 'Numeric Entry', DI: 'Data Interpretation', TC: 'Text Completion', SE: 'Sentence Equivalence', RC: 'Reading Comprehension' };

function Row({ label, right, value, max = 1 }: { label: string; right: string; value: number; max?: number }) {
  return (
    <li>
      <div className="mb-1 flex justify-between gap-3 text-sm"><span className="min-w-0 truncate font-medium">{label}</span><span className="shrink-0 tabular-nums text-muted">{right}</span></div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-2"><div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (value / max) * 100)}%` }} /></div>
    </li>
  );
}

export function StatsPanel({ lessons, est }: Props) {
  const attempts = useAttempts();
  const reasons = useReasons();
  const [now] = useState(() => Date.now());

  const s = useMemo(() => {
    const real = attempts.filter((a) => a.mode !== 'check');
    const acc = (xs: typeof real) => (xs.length ? xs.filter((a) => a.correct).length / xs.length : null);
    const group = <K extends string | number>(key: (a: (typeof real)[number]) => K) => {
      const m = new Map<K, typeof real>();
      for (const a of real) { const k = key(a); (m.get(k) ?? m.set(k, []).get(k)!).push(a); }
      return m;
    };
    const byType = [...group((a) => a.type)].map(([k, v]) => ({ k, n: v.length, acc: acc(v)! })).sort((a, b) => b.n - a.n);
    const byDiff = [...group((a) => a.difficulty)].map(([k, v]) => ({ k, n: v.length, acc: acc(v)! })).sort((a, b) => a.k - b.k);
    const byChapter = [...group((a) => a.lessonId.split('-')[0])].map(([k, v]) => ({ k, n: v.length, acc: acc(v)! }));
    const weakest = [...group((a) => a.lessonId)].map(([k, v]) => ({ k, n: v.length, acc: acc(v)! })).filter((x) => x.n >= 5).sort((a, b) => a.acc - b.acc).slice(0, 5);
    const timed = real.filter((a) => est[a.qid]);
    const avg = timed.length ? timed.reduce((t, a) => t + a.ms / 1000, 0) / timed.length : null;
    const target = timed.length ? timed.reduce((t, a) => t + est[a.qid], 0) / timed.length : null;
    return { n: real.length, acc: acc(real), byType, byDiff, byChapter, weakest, avg, target, mastered: [...latestByQuestion(attempts).values()].filter((a) => a.correct).length, activity: activityByDay(attempts, now) };
  }, [attempts, est, now]);

  const title = (id: string) => lessons.find((l) => l.id === id)?.title ?? id;
  const chapterTitle = (id: string) => lessons.find((l) => l.chapter === id)?.chapterTitle ?? id;
  const reasonCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of Object.values(reasons)) c[r] = (c[r] ?? 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [reasons]);
  const maxAct = Math.max(1, ...s.activity.map((d) => d.n));

  if (s.n === 0) return <p className={`${card} text-muted`}>No practice yet. Finish a practice set and your stats appear here.</p>;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3 text-center">
        {[['Answered', String(s.n)], ['Accuracy', s.acc === null ? '—' : pct(s.acc)], ['Mastered', String(s.mastered)]].map(([k, v]) => (
          <div key={k} className={card}><p className="text-2xl font-extrabold tabular-nums">{v}</p><p className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</p></div>
        ))}
      </div>

      {s.avg !== null && s.target !== null && (
        <section className={card}><h2 className="font-bold">Pace</h2>
          <p className="mt-1 text-sm text-muted">You average <strong className="text-fg">{Math.round(s.avg)}s</strong> per question; the target for the questions you did is <strong className="text-fg">{Math.round(s.target)}s</strong>. {s.avg > s.target * 1.25 ? 'Work on speed after accuracy is solid.' : 'You are on pace.'}</p></section>
      )}

      <section className={card} aria-labelledby="act"><h2 id="act" className="font-bold">Last 14 days</h2>
        <div className="mt-3 flex h-24 items-end gap-1" role="img" aria-label="Questions answered per day for the last 14 days">
          {s.activity.map((d) => <div key={d.day} title={`${d.n} answered`} className="flex-1 rounded-t bg-accent/80" style={{ height: `${Math.max(d.n ? 6 : 2, (d.n / maxAct) * 100)}%`, opacity: d.n ? 1 : 0.25 }} />)}
        </div></section>

      <section className={card}><h2 className="font-bold">By chapter</h2><ul className="mt-3 space-y-3">{s.byChapter.map((c) => <Row key={c.k} label={chapterTitle(c.k)} right={`${pct(c.acc)} · ${c.n}`} value={c.acc} />)}</ul></section>
      <section className={card}><h2 className="font-bold">By question type</h2><ul className="mt-3 space-y-3">{s.byType.map((c) => <Row key={c.k} label={TYPE_LABEL[c.k] ?? c.k} right={`${pct(c.acc)} · ${c.n}`} value={c.acc} />)}</ul></section>
      <section className={card}><h2 className="font-bold">By difficulty</h2><ul className="mt-3 space-y-3">{s.byDiff.map((c) => <Row key={c.k} label={`Level ${c.k}`} right={`${pct(c.acc)} · ${c.n}`} value={c.acc} />)}</ul></section>

      {s.weakest.length > 0 && (
        <section className={card}><h2 className="font-bold">Weakest lessons</h2>
          <ul className="mt-3 divide-y divide-line">{s.weakest.map((w) => { const l = lessons.find((x) => x.id === w.k); return (
            <li key={w.k} className="flex items-center gap-3 py-2.5 text-sm"><span className="min-w-0 flex-1 truncate font-medium">{title(w.k)}</span><span className="tabular-nums text-muted">{pct(w.acc)}</span>
              {l && <Link href={`/learn/${l.chapter}/${l.id}`} className="font-semibold text-accent hover:underline">Revisit</Link>}</li>); })}</ul></section>
      )}

      {reasonCounts.length > 0 && (
        <section className={card}><h2 className="font-bold">Why you miss questions</h2>
          <ul className="mt-3 space-y-3">{reasonCounts.map(([r, n]) => <Row key={r} label={REASON_LABEL[r as keyof typeof REASON_LABEL] ?? r} right={String(n)} value={n} max={reasonCounts[0][1]} />)}</ul></section>
      )}
    </div>
  );
}
