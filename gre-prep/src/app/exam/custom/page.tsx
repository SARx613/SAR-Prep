import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getByIds } from '@/content';
import { SetRunner } from '@/components/exam/SetRunner';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Practice' };

/* An ad-hoc set: the question ids come from the URL (Qbank, Review, mocks). */
export default async function CustomExamPage({ searchParams }: { searchParams: Promise<{ mode?: string; ids?: string }> }) {
  const { mode, ids } = await searchParams;
  const questions = getByIds((ids ?? '').split(',').filter(Boolean).slice(0, 60));
  if (questions.length === 0) notFound();
  const timed = mode === 'timed';
  const limit = Math.ceil(questions.reduce((a, q) => a + q.estSeconds, 0) / 60) * 60;
  return (
    <SetRunner
      title={timed ? 'Timed practice' : 'Custom practice'}
      questions={questions}
      mode={timed ? 'timed' : 'tutor'}
      timeLimitSec={timed ? limit : undefined}
      backHref="/practice"
      storageKey={`exam:${(ids ?? '').slice(0, 80)}:${timed ? 't' : 'u'}`}
    />
  );
}
