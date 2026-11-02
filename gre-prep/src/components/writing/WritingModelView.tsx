'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PenLine } from 'lucide-react';
import type { SampleEssay, WritingModel } from '@/types/writing';

const card = 'rounded-[var(--radius)] border border-line bg-surface p-5';
const LABEL: Record<number, string> = { 6: 'Outstanding', 4: 'Adequate', 2: 'Seriously flawed' };

/** Splits one paragraph around the annotated quotes (first occurrence, no overlaps). */
function segments(paragraph: string, quotes: { quote: string; n: number }[]) {
  const hits = quotes
    .map((q) => ({ ...q, at: paragraph.indexOf(q.quote) }))
    .filter((q) => q.at >= 0)
    .sort((a, b) => a.at - b.at);
  const out: ({ text: string; n?: number })[] = [];
  let pos = 0;
  for (const h of hits) {
    if (h.at < pos) continue;
    if (h.at > pos) out.push({ text: paragraph.slice(pos, h.at) });
    out.push({ text: h.quote, n: h.n });
    pos = h.at + h.quote.length;
  }
  if (pos < paragraph.length) out.push({ text: paragraph.slice(pos) });
  return out;
}

function Sample({ s }: { s: SampleEssay }) {
  const quotes = s.annotations.map((a, i) => ({ quote: a.quote, n: i + 1 }));
  const words = s.essay.join(' ').split(/\s+/).length;
  return (
    <div>
      <p className="text-sm text-muted">{words} words · numbered passages are explained below the essay.</p>
      <div className="mt-3 space-y-3 rounded-[var(--radius)] border border-line bg-surface p-4 text-[15px] leading-relaxed">
        {s.essay.map((p, i) => (
          <p key={i}>
            {segments(p, quotes).map((seg, j) =>
              seg.n ? (
                <mark key={j} className="rounded bg-accent-soft px-0.5 text-fg">
                  {seg.text}
                  <sup className="ml-0.5 font-bold text-accent-ink">{seg.n}</sup>
                </mark>
              ) : (
                <span key={j}>{seg.text}</span>
              ),
            )}
          </p>
        ))}
      </div>
      <ol className="mt-4 space-y-2 text-sm">
        {s.annotations.map((a, i) => (
          <li key={i} className="flex gap-2">
            <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xs font-bold text-accent-ink">{i + 1}</span>
            <span><span className="text-muted">“{a.quote}”</span> — {a.note}</span>
          </li>
        ))}
      </ol>
      <div className="mt-5 rounded-[var(--radius)] bg-accent-soft p-4 text-sm text-accent-ink">
        <p className="font-bold">Why this is a {s.score}</p>
        <p className="mt-1">{s.whyThisScore}</p>
      </div>
      <div className="mt-4 text-sm">
        <p className="font-bold">{s.score === 6 ? 'Polishing a 6' : `To move up from a ${s.score}`}</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          {s.toReachNext.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </div>
    </div>
  );
}

export function WritingModelView({ model, promptId }: { model: WritingModel; promptId: string }) {
  const samples = model.samples ?? [];
  const [score, setScore] = useState<number>(samples[0]?.score ?? 6);
  const current = samples.find((s) => s.score === score);

  return (
    <div className="mt-6 space-y-8">
      <section className={card}>
        <h2 className="text-lg font-bold">Ways to take a position</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {model.thesisOptions.map((t, i) => (
            <li key={i}><span className="mr-2 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-bold uppercase text-accent-ink">{t.stance}</span>{t.thesis}</li>
          ))}
        </ul>
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold">Idea bank</h2>
        <ul className="mt-3 space-y-3 text-sm">
          {model.ideaBank.map((d, i) => (
            <li key={i}><p className="font-semibold">{d.angle}</p><p className="text-muted">{d.example}</p><p>{d.use}</p></li>
          ))}
        </ul>
        <div className="mt-4 rounded-[var(--radius)] bg-surface-2 p-3 text-sm">
          <p className="font-semibold">Strongest objection</p>
          <p className="text-muted">{model.counter.objection}</p>
          <p className="mt-2 font-semibold">A strong reply</p>
          <p>{model.counter.response}</p>
        </div>
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold">Outline you could follow</h2>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm">{model.outline.map((o, i) => <li key={i}>{o}</li>)}</ol>
        <h3 className="mt-5 font-bold">Mistakes to avoid on this topic</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm">{model.pitfalls.map((p, i) => <li key={i}>{p}</li>)}</ul>
      </section>

      {samples.length > 0 && (
        <section>
          <h2 className="text-lg font-bold">Annotated sample responses</h2>
          <p className="text-sm text-muted">Three original responses at different levels of the 0–6 guide. They are illustrations, not official scores.</p>
          <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Score level">
            {samples.map((s) => (
              <button key={s.score} role="tab" aria-selected={score === s.score} onClick={() => setScore(s.score)}
                className={`min-h-[40px] rounded-full border px-4 text-sm font-semibold ${score === s.score ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong bg-surface text-muted'}`}>
                {s.score} · {LABEL[s.score]}
              </button>
            ))}
          </div>
          <div className="mt-4" role="tabpanel">{current && <Sample s={current} />}</div>
        </section>
      )}

      <Link href={`/writing/session?prompt=${promptId}`} className="inline-flex h-11 items-center gap-2 rounded-[var(--radius)] bg-accent px-5 text-sm font-bold text-accent-fg">
        <PenLine size={16} aria-hidden /> Write this essay now
      </Link>
    </div>
  );
}
