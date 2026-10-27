import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowLeft, ArrowRight, BookOpen, Clock, ExternalLink, Lightbulb } from 'lucide-react';
import { getChapter, getChapters, getLesson, getSet, getSource, getTopics, neighbours } from '@/content';
import { RichText } from '@/components/RichText';
import { LessonChecks } from '@/components/learn/LessonChecks';
import { LessonProgress } from '@/components/learn/Progress';
import { TopicChecklist } from '@/components/learn/TopicChecklist';
import { OfflineWarm } from '@/components/OfflineWarm';
import { PracticeActions } from '@/components/learn/PracticeActions';


export function generateStaticParams() {
  return getChapters().flatMap((ch) => ch.lessons.filter((l) => l.available).map((l) => ({ chapter: ch.id, lesson: l.meta.id })));
}

export async function generateMetadata({ params }: { params: Promise<{ lesson: string }> }): Promise<Metadata> {
  const l = getLesson((await params).lesson);
  return { title: l?.meta.title ?? 'Lesson' };
}

export default async function LessonPage({ params }: { params: Promise<{ chapter: string; lesson: string }> }) {
  const { chapter, lesson } = await params;
  const view = getLesson(lesson);
  const ch = getChapter(chapter);
  if (!view || !ch || view.meta.chapter !== chapter) notFound();

  const { meta, body, checks, practiceCount } = view;
  const src = getSource(meta.officialRef.source);
  const { prev, next } = neighbours(meta.id);
  const topics = getTopics(meta.id);
  const warm = [`/exam/${meta.id}`, `/learn/${meta.chapter}`, ...[prev, next].flatMap((n) => (n ? [`/learn/${n.meta.chapter}/${n.meta.id}`] : []))];

  return (
    <article className="mx-auto max-w-3xl px-4 pb-12 sm:px-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
      <Link href={`/learn/${ch.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg">
        <ArrowLeft size={15} aria-hidden /> {ch.title}
      </Link>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight">{meta.title}</h1>
      <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-faint">
        <span className="inline-flex items-center gap-1"><Clock size={12} aria-hidden />{meta.estMinutes} min</span>
        {src && (
          <a href={src.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline-offset-2 hover:text-fg hover:underline">
            Source: {src.title.replace(/ \(ETS.*?\)$/, '')} · {meta.officialRef.section}
            <ExternalLink size={11} aria-hidden />
          </a>
        )}
        {body.status === 'draft' && <span className="rounded-full bg-warn-soft px-2 py-0.5 font-semibold text-warn">Draft</span>}
      </p>

      <p className="mt-5 rounded-[var(--radius)] border-l-4 border-accent bg-accent-soft px-4 py-3 text-[15px]"><RichText inline>{body.why}</RichText></p>

      <section className="mt-8" aria-labelledby="rule">
        <h2 id="rule" className="mb-3 flex items-center gap-2 text-lg font-bold"><BookOpen size={18} aria-hidden /> The rule</h2>
        <RichText>{body.rule}</RichText>
      </section>

      <section className="mt-8" aria-labelledby="ex">
        <h2 id="ex" className="mb-3 text-lg font-bold">Worked example{body.examples.length > 1 ? 's' : ''}</h2>
        <div className="space-y-4">
          {body.examples.map((e, i) => (
            <div key={i} className="rounded-[var(--radius)] border border-line bg-surface p-4 sm:p-5">
              <div className="font-semibold"><RichText>{e.prompt}</RichText></div>
              <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[15px] marker:text-faint">
                {e.steps.map((s, j) => <li key={j} className="pl-1"><RichText inline>{s}</RichText></li>)}
              </ol>
              <p className="mt-3 rounded-md bg-good-soft px-3 py-2 text-sm font-semibold text-good">Answer: <RichText inline>{e.answer}</RichText></p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 flex gap-3 rounded-[var(--radius)] border border-warn/40 bg-warn-soft p-4" aria-labelledby="trap">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-warn" aria-hidden />
        <div>
          <h2 id="trap" className="font-bold text-warn">Trap</h2>
          <div className="mt-1 text-[15px]"><RichText>{body.trap}</RichText></div>
        </div>
      </section>

      {topics.length > 0 && <section className="mt-8" aria-label="Topics"><TopicChecklist topics={topics} /></section>}

      <section className="mt-10" aria-labelledby="check">
        <h2 id="check" className="mb-3 flex items-center gap-2 text-lg font-bold"><Lightbulb size={18} aria-hidden /> Check yourself</h2>
        <LessonChecks checks={checks} />
      </section>

      <section className="mt-10 rounded-[var(--radius)] border border-line bg-surface p-5" aria-labelledby="practice">
        <h2 id="practice" className="text-lg font-bold">Practice set</h2>
        {practiceCount > 0 ? (
          <>
            <p className="mt-1 text-sm text-muted">{practiceCount} questions in the real GRE formats, easiest to hardest.</p>
            <div className="mt-3 max-w-sm"><LessonProgress lessonId={meta.id} total={practiceCount} /></div>
            <PracticeActions lessonId={meta.id} qids={getSet(meta.id).map((q) => q.id)} />
          </>
        ) : (
          <p className="mt-1 text-sm text-muted">The practice set for this lesson is not available yet.</p>
        )}
      </section>

      <OfflineWarm urls={warm} />

      <nav aria-label="Lesson navigation" className="mt-8 grid grid-cols-2 gap-3">
        {prev ? (
          <Link href={`/learn/${prev.meta.chapter}/${prev.meta.id}`} className="flex flex-col rounded-[var(--radius)] border border-line p-3 text-left hover:border-line-strong">
            <span className="flex items-center gap-1 text-xs text-faint"><ArrowLeft size={12} aria-hidden /> Previous</span>
            <span className="text-sm font-semibold">{prev.meta.title}</span>
          </Link>
        ) : <span />}
        {next ? (
          <Link href={`/learn/${next.meta.chapter}/${next.meta.id}`} className="flex flex-col items-end rounded-[var(--radius)] border border-line p-3 text-right hover:border-line-strong">
            <span className="flex items-center gap-1 text-xs text-faint">Next <ArrowRight size={12} aria-hidden /></span>
            <span className="text-sm font-semibold">{next.meta.title}</span>
          </Link>
        ) : <span />}
      </nav>
    </article>
  );
}
