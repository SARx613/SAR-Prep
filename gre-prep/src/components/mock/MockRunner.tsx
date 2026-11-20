'use client';

import { useCallback, useMemo } from 'react';
import { ExamPlayer, type PlayerResult } from '@/components/exam/ExamPlayer';
import type { ClientQuestion } from '@/content/types';
import { useLocalValue } from '@/hooks/useLocalValue';
import { estimateSetScore } from '@/lib/gre-score';
import { MOCKS_KEY, NO_MOCKS, levelFor, parseMocks, recordMockPart, type Level, type Section } from '@/lib/mock';

/* One timed mock section. Section 1 goes straight on to section 2 (Hard,
 * difficulty 4–5) without showing answers — as on the real test. Section 2
 * and the diagnostic end on the results screen with exact scores. */

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
  const store = useLocalValue(MOCKS_KEY, parseMocks, NO_MOCKS);
  const part1 = part === 2 && section !== 'diag' ? store[kind]?.[`${section}1`] ?? null : null;

  const mockSummary = useMemo(
    () =>
      part1 && section !== 'diag'
        ? {
            section,
            part1Correct: part1.correct,
            part1Total: part1.total,
            level: level ?? 'hard',
          }
        : null,
    [part1, section, level],
  );

  const onComplete = useCallback(
    (results: PlayerResult[]) => {
      const correct = results.filter((r) => r.grade.isCorrect).length;
      const byChapter: Record<string, { c: number; n: number }> = {};
      for (const r of results) {
        const ch = r.q.lessonId.split('-')[0];
        byChapter[ch] = { c: (byChapter[ch]?.c ?? 0) + (r.grade.isCorrect ? 1 : 0), n: (byChapter[ch]?.n ?? 0) + 1 };
      }
      const diagScore =
        section === 'diag'
          ? {
              verbal: estimateSetScore(
                results.map((r) => ({ id: r.q.id, section: r.q.section, difficulty: r.q.difficulty, correct: r.grade.isCorrect })),
                'verbal',
              ),
              quant: estimateSetScore(
                results.map((r) => ({ id: r.q.id, section: r.q.section, difficulty: r.q.difficulty, correct: r.grade.isCorrect })),
                'quant',
              ),
            }
          : undefined;
      recordMockPart(kind, section, part, { correct, total: results.length, level, ts: Date.now() }, byChapter, diagScore);
    },
    [kind, section, part, level],
  );

  const afterFinish = useCallback(
    (results: PlayerResult[]) => {
      if (part !== 1 || section === 'diag') return null;
      const correct = results.filter((r) => r.grade.isCorrect).length;
      return `/mock/run/${kind}/${section}/2?level=${levelFor(correct, results.length)}`;
    },
    [kind, section, part],
  );

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
      setId={`mock:${kind}:${section}:${part}`}
      runKind={section === 'diag' ? 'diag' : 'mock'}
      mockSummary={mockSummary}
      onComplete={onComplete}
      afterFinish={afterFinish}
    />
  );
}
