import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { getChapters } from '@/content';
import { ChapterProgress } from '@/components/learn/Progress';

export const metadata: Metadata = { title: 'Learn' };
export const dynamic = 'force-dynamic';

const TRACKS = [
  ['quant', 'Quantitative Reasoning', 'Follows the ETS Math Review.'],
  ['verbal', 'Verbal Reasoning', 'Text Completion, Sentence Equivalence, Reading Comprehension.'],
  ['writing', 'Analytical Writing', 'The single “Analyze an Issue” task.'],
  ['test', 'Test day', 'Structure, timing and navigation.'],
] as const;

export default function LearnPage() {
  const chapters = getChapters();
  return (
    <div className="mx-auto max-w-4xl px-4 pb-10 sm:px-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
      <h1 className="text-3xl font-extrabold tracking-tight">Learn</h1>
      <p className="mt-1 max-w-prose text-muted">
        Every lesson is tied to an official ETS source, kept short, and ends with practice in the real GRE formats.
      </p>

      {TRACKS.map(([track, title, blurb]) => {
        const list = chapters.filter((c) => c.track === track);
        if (list.length === 0) return null;
        return (
          <section key={track} className="mt-10" aria-labelledby={`t-${track}`}>
            <h2 id={`t-${track}`} className="text-lg font-bold">{title}</h2>
            <p className="text-sm text-muted">{blurb}</p>
            <ul className="mt-3 grid gap-3 sm:grid-cols-2">
              {list.map((ch) => {
                const ready = ch.lessons.filter((l) => l.available).length;
                return (
                  <li key={ch.id}>
                    <Link
                      href={`/learn/${ch.id}`}
                      className="group flex h-full flex-col gap-2 rounded-[var(--radius)] border border-line bg-surface p-4 transition-colors hover:border-line-strong"
                    >
                      <div className="flex items-start gap-2">
                        <h3 className="flex-1 font-semibold">{ch.title}</h3>
                        <ChevronRight size={18} className="mt-0.5 shrink-0 text-faint group-hover:text-fg" aria-hidden />
                      </div>
                      <p className="text-sm text-muted">{ch.summary}</p>
                      {ch.supporting && (
                        <p className="w-fit rounded-full bg-warn-soft px-2 py-0.5 text-[11px] font-semibold text-warn">Study aid — not an ETS topic</p>
                      )}
                      <div className="mt-auto pt-1">
                        <ChapterProgress lessons={ch.lessons.map((l) => ({ id: l.meta.id, total: l.practiceCount }))} />
                        <p className="mt-1 text-xs text-faint">{ready}/{ch.lessons.length} lessons ready</p>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
