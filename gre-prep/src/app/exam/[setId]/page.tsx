import type { Metadata } from 'next';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { content, getChapter, getChapterTest, getChapters, getSet } from '@/content';
import { ExamEntry } from '@/components/exam/ExamEntry';
import { ExamSkeleton } from '@/components/exam/ExamSkeleton';

export const metadata: Metadata = { title: 'Practice' };

/* Lesson practice sets and chapter tests are prerendered at build time: they
 * never depend on the visitor, so they load instantly and can be saved offline.
 * Ad-hoc sets (Qbank, Review, mocks) live under /exam/custom. */
export function generateStaticParams() {
  const c = content();
  const lessons = getChapters().flatMap((ch) => ch.lessons.filter((l) => l.available && c.questionSets.has(l.meta.id)).map((l) => ({ setId: l.meta.id })));
  const chapters = getChapters().map((ch) => ({ setId: `chapter-${ch.id}` }));
  return [...lessons, ...chapters];
}

export default async function ExamSetPage({ params }: { params: Promise<{ setId: string }> }) {
  const { setId } = await params;
  const chapterId = setId.startsWith('chapter-') ? setId.slice(8) : null;
  const questions = chapterId ? getChapterTest(chapterId) : getSet(setId);
  if (questions.length === 0) notFound();

  const lesson = content().syllabus.lessons.find((l) => l.id === setId);
  const chapter = chapterId ? getChapter(chapterId) : null;
  const title = chapter ? `Chapter test: ${chapter.title}` : lesson?.title ?? setId;
  return (
    <Suspense fallback={<ExamSkeleton title={title} />}>
      <ExamEntry
        setId={setId}
        title={title}
        questions={questions}
        chapterTest={!!chapterId}
        backHref={chapterId ? `/learn/${chapterId}` : lesson ? `/learn/${lesson.chapter}/${lesson.id}` : '/practice'}
      />
    </Suspense>
  );
}
