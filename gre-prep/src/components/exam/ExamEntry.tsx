'use client';

import { useSearchParams } from 'next/navigation';
import type { ClientQuestion } from '@/content/types';
import { SetRunner } from './SetRunner';

/* Entry for a statically generated practice set. The page HTML is the same for
 * every mode, so it can be cached and saved offline; the mode (?mode=timed) is
 * read here, in the browser. */
export function ExamEntry({
  setId, title, questions, backHref, chapterTest,
}: {
  setId: string; title: string; questions: ClientQuestion[]; backHref: string; chapterTest: boolean;
}) {
  const mode = useSearchParams().get('mode');
  const timed = mode === 'timed' || chapterTest;
  // ~ the per-question target the real test allows, rounded up to a whole minute.
  const limit = Math.ceil(questions.reduce((a, q) => a + q.estSeconds, 0) / 60) * 60;
  return (
    <SetRunner
      title={chapterTest ? title : timed && setId === 'custom' ? 'Timed practice' : title}
      questions={questions}
      mode={timed ? 'timed' : 'tutor'}
      timeLimitSec={timed ? limit : undefined}
      backHref={backHref}
      storageKey={`exam:${setId}:${timed ? 't' : 'u'}`}
    />
  );
}
