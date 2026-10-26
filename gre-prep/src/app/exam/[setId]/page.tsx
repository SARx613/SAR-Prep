import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { content, getSet } from '@/content';
import { SetRunner } from '@/components/exam/SetRunner';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Practice' };

export default async function ExamSetPage({
  params,
  searchParams,
}: {
  params: Promise<{ setId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { setId } = await params;
  const { mode } = await searchParams;
  const questions = getSet(setId);
  if (questions.length === 0) notFound();

  const lesson = content().syllabus.lessons.find((l) => l.id === setId);
  const title = lesson?.title ?? setId;
  const timed = mode === 'timed';
  // ~ the per-question target the real test allows, rounded up to a whole minute.
  const limit = Math.ceil(questions.reduce((a, q) => a + q.estSeconds, 0) / 60) * 60;

  return (
    <SetRunner
      title={title}
      questions={questions}
      mode={timed ? 'timed' : 'tutor'}
      timeLimitSec={timed ? limit : undefined}
      backHref={lesson ? `/learn/${lesson.chapter}/${lesson.id}` : '/practice'}
      storageKey={`exam:${setId}:${timed ? 't' : 'u'}`}
    />
  );
}
