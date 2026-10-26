import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { content, getByIds, getChapter, getChapterTest, getSet } from '@/content';
import { SetRunner } from '@/components/exam/SetRunner';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Practice' };

export default async function ExamSetPage({
  params,
  searchParams,
}: {
  params: Promise<{ setId: string }>;
  searchParams: Promise<{ mode?: string; ids?: string; n?: string }>;
}) {
  const { setId } = await params;
  const { mode, ids } = await searchParams;
  // "custom" is an ad-hoc set: the question ids come from the URL (Qbank, Review, mocks).
  const custom = setId === 'custom';
  const chapterId = setId.startsWith('chapter-') ? setId.slice(8) : null;
  const questions = chapterId ? getChapterTest(chapterId) : custom ? getByIds((ids ?? '').split(',').filter(Boolean).slice(0, 60)) : getSet(setId);
  if (questions.length === 0) notFound();

  const lesson = content().syllabus.lessons.find((l) => l.id === setId);
  const chapter = chapterId ? getChapter(chapterId) : null;
  const title = chapter ? `Chapter test: ${chapter.title}` : custom ? (mode === 'timed' ? 'Timed practice' : 'Custom practice') : lesson?.title ?? setId;
  const timed = mode === 'timed' || !!chapterId;
  // ~ the per-question target the real test allows, rounded up to a whole minute.
  const limit = Math.ceil(questions.reduce((a, q) => a + q.estSeconds, 0) / 60) * 60;

  return (
    <SetRunner
      title={title}
      questions={questions}
      mode={timed ? 'timed' : 'tutor'}
      timeLimitSec={timed ? limit : undefined}
      backHref={chapterId ? `/learn/${chapterId}` : lesson ? `/learn/${lesson.chapter}/${lesson.id}` : '/practice'}
      storageKey={`exam:${custom ? (ids ?? '').slice(0, 80) : setId}:${timed ? 't' : 'u'}`}
    />
  );
}
