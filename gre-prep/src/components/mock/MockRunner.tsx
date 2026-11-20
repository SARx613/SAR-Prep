'use client';

import { useCallback, useMemo } from 'react';
import { ExamPlayer, type PlayerResult } from '@/components/exam/ExamPlayer';
import type { ClientQuestion } from '@/content/types';
import { useAttempts } from '@/hooks/useAttempts';
import { useLocalValue } from '@/hooks/useLocalValue';
import { estimateSetScore } from '@/lib/gre-score';
import { reconstructPartResults } from '@/lib/mock-review';
import { MOCKS_KEY, NO_MOCKS, levelFor, parseMocks, recordMockPart, type Level, type Section } from '@/lib/mock';

/* One timed mock section. Section 1 goes straight on to section 2 (Hard,
 * difficulty 4–5) without showing answers — as on the real test. Section 2
 * ends on the combined results screen with exact scores and full corrections
 * for all 27 questions (Section 1 + Section 2). */

interface Props {
  kind: string;
  section: Section | 'diag';
  part: 1 | 2;
  level?: Level;
  title: string;
  questions: ClientQuestion[];
  part1Questions?: ClientQuestion[];
  seconds: number;
}

export function MockRunner({ kind, section, part, level, title, questions, part1Questions, seconds }: Props) {
  const store = useLocalValue(MOCKS_KEY, parseMocks, NO_MOCKS);
  const attempts = useAttempts();
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

  const priorResults = useMemo(() => {
    if (part !== 2 || section === 'diag' || !part1Questions || part1Questions.length === 0) return undefined;
    return reconstructPartResults(part1Questions, part1?.items, attempts);
  }, [part, section, part1Questions, part1?.items, attempts]);

  const onComplete = useCallback(
    (results: PlayerResult[]) => {
      const ownIds = new Set(questions.map((q) => q.id));
      const own = results.filter((r) => ownIds.has(r.q.id));
      const itemsToSave = own.length > 0 ? own : results;
      const correct = itemsToSave.filter((r) => r.grade.isCorrect).length;
      const byChapter: Record<string, { c: number; n: number }> = {};
      for (const r of itemsToSave) {
        const ch = r.q.lessonId.split('-')[0];
        byChapter[ch] = { c: (byChapter[ch]?.c ?? 0) + (r.grade.isCorrect ? 1 : 0), n: (byChapter[ch]?.n ?? 0) + 1 };
      }
      const diagScore =
        section === 'diag'
          ? {
              verbal: estimateSetScore(
                itemsToSave.map((r) => ({ id: r.q.id, section: r.q.section, difficulty: r.q.difficulty, correct: r.grade.isCorrect })),
                'verbal',
              ),
              quant: estimateSetScore(
                itemsToSave.map((r) => ({ id: r.q.id, section: r.q.section, difficulty: r.q.difficulty, correct: r.grade.isCorrect })),
                'quant',
              ),
            }
          : undefined;
      const savedItems = itemsToSave.map((r) => ({
        qid: r.q.id,
        sel: r.sel,
        correct: r.grade.isCorrect,
        incomplete: r.grade.incomplete || undefined,
        ms: r.ms,
      }));
      recordMockPart(
        kind,
        section,
        part,
        { correct, total: itemsToSave.length, level, ts: Date.now(), items: savedItems },
        byChapter,
        diagScore,
      );
    },
    [kind, section, part, level, questions],
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
      priorResults={priorResults}
      onComplete={onComplete}
      afterFinish={afterFinish}
    />
  );
}
