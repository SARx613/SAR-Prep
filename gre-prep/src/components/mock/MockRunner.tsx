'use client';

import { useCallback } from 'react';
import { ExamPlayer, type PlayerResult } from '@/components/exam/ExamPlayer';
import type { ClientQuestion } from '@/content/types';
import { levelFor, recordMockPart, type Level, type Section } from '@/lib/mock';

/* One timed mock section. Section 1 goes straight on to section 2 (its level
 * chosen by how section 1 went) without showing answers — as on the real
 * test. Section 2 and the diagnostic end on the results screen. */

interface Props {
  kind: string;
  section: Section | 'diag';
  part: 1 | 2;
  level?: Level;
  title: string;
  questions: ClientQuestion[];
  seconds: number;
}

export function MockRunner({ kind, section, part, level, title, questions, seconds }: Props) {
  const onComplete = useCallback((results: PlayerResult[]) => {
    const correct = results.filter((r) => r.grade.isCorrect).length;
    const byChapter: Record<string, { c: number; n: number }> = {};
    for (const r of results) {
      const ch = r.q.lessonId.split('-')[0];
      byChapter[ch] = { c: (byChapter[ch]?.c ?? 0) + (r.grade.isCorrect ? 1 : 0), n: (byChapter[ch]?.n ?? 0) + 1 };
    }
    recordMockPart(kind, section, part, { correct, total: results.length, level, ts: Date.now() }, byChapter);
  }, [kind, section, part, level]);

  const afterFinish = useCallback((results: PlayerResult[]) => {
    if (part !== 1 || section === 'diag') return null;
    const correct = results.filter((r) => r.grade.isCorrect).length;
    return `/mock/run/${kind}/${section}/2?level=${levelFor(correct, results.length)}`;
  }, [kind, section, part]);

  return (
    <ExamPlayer
      key={`${kind}-${section}-${part}`}
      title={title}
      questions={questions}
      mode="timed"
      timeLimitSec={seconds}
      backHref="/mock"
      attemptMode="mock"
      storageKey={`mock:${kind}:${section}:${part}`}
      onComplete={onComplete}
      afterFinish={afterFinish}
    />
  );
}
