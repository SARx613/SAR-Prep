import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Clock, Lock } from 'lucide-react';
import { getChapter, getChapters } from '@/content';
import { LessonProgress } from '@/components/learn/Progress';


export async function generateMetadata({ params }: { params: Promise<{ chapter: string }> }): Promise<Metadata> {
  const ch = getChapter((await params).chapter);
  return { title: ch?.title ?? 'Chapter' };
}

export function generateStaticParams() {
  return getChapters().map((c) => ({ chapter: c.id }));
}

export default async function ChapterPage({ params }: { params: Promise<{ chapter: string }> }) {
  const ch = getChapter((await params).chapter);
  if (!ch) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
      <Link href="/learn" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft size={15} aria-hidden /> All chapters
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{ch.title}</h1>
      <p className="mt-1 max-w-prose text-muted">{ch.summary}</p>

      {ch.lessons.reduce((n, l) => n + l.practiceCount, 0) >= 10 && (
        <Link href={`/exam/chapter-${ch.id}`} className="mt-5 inline-flex h-11 items-center rounded-[var(--radius)] border border-line-strong bg-surface px-5 text-sm font-semibold hover:border-accent">
          Take the chapter test · timed, up to 20 questions
        </Link>
      )}

      <ol className="mt-6 divide-y divide-line overflow-hidden rounded-[var(--radius)] border border-line bg-surface">
        {ch.lessons.map((l, i) => {
          const inner = (
            <div className="flex items-start gap-3 px-4 py-3.5">
              <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-surface-2 text-xs font-bold text-muted">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className={`font-semibold ${l.available ? '' : 'text-faint'}`}>{l.meta.title}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-faint">
                  <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden />{l.meta.estMinutes} min</span>
                  <span>{l.meta.officialRef.label}</span>
                </p>
                {l.available && <div className="mt-2 max-w-xs"><LessonProgress lessonId={l.meta.id} total={l.practiceCount} /></div>}
              </div>
              {!l.available && <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-faint"><Lock size={12} aria-hidden />Coming soon</span>}
            </div>
          );
          return (
            <li key={l.meta.id}>
              {l.available ? <Link href={`/learn/${ch.id}/${l.meta.id}`} className="block hover:bg-surface-2">{inner}</Link> : inner}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
