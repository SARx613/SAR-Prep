'use client';

import { useState } from 'react';
import { grade as gradeQuestion, type Grade } from '@/lib/grading';
import { recordAttempts } from '@/lib/attempts';
import type { ClientQuestion } from '@/content/types';
import { Feedback } from '@/components/exam/Feedback';
import { QuestionPane } from '@/components/exam/QuestionPane';
import { PassagePane } from '@/components/exam/PassagePane';
import { Figure } from '@/components/exam/Figure';
import { emptySelection, formatOf, hasAnswer, toResponse, type Selection } from '@/components/exam/selection';

/* The “Check yourself” block: 2–3 micro-questions with immediate feedback. */

function Check({ q, n }: { q: ClientQuestion; n: number }) {
  const [sel, setSel] = useState<Selection>(() => emptySelection(q));
  const [grade, setGrade] = useState<Grade | null>(null);
  const [t0] = useState(() => Date.now());

  const submit = () => {
    const g = gradeQuestion(q, toResponse(q, sel));
    setGrade(g);
    recordAttempts([{ qid: q.id, lessonId: q.lessonId, type: q.type, difficulty: q.difficulty, correct: g.isCorrect, ms: Date.now() - t0, ts: Date.now(), mode: 'check' }]);
  };

  return (
    <div className="rounded-[var(--radius)] border border-line bg-surface p-4 sm:p-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-faint">Check {n}</p>
      {q.passage && (
        <div className="mb-4 max-h-72 overflow-y-auto rounded-md border border-line bg-surface-2 p-3 text-[15px]">
          <PassagePane
            passage={q.passage}
            selectable={q.type === 'RC' && formatOf(q) === 'select_in_passage'}
            paragraphIndex={(q.content as { paragraphIndex?: number }).paragraphIndex}
            selected={sel.sentence}
            onPick={(s) => setSel({ ...sel, sentence: s })}
            locked={!!grade}
            correctSentence={grade ? grade.expected[0] : undefined}
          />
        </div>
      )}
      {q.figureSpec && <div className="mb-4"><Figure spec={q.figureSpec} /></div>}
      <QuestionPane q={q} sel={sel} onChange={setSel} locked={!!grade} grade={grade} showLetters={!!grade} />
      {!grade ? (
        <button
          type="button"
          onClick={submit}
          disabled={!hasAnswer(q, sel)}
          className="mt-4 h-11 rounded-[var(--radius)] bg-accent px-5 text-sm font-bold text-accent-fg disabled:opacity-40"
        >
          Check answer
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          <Feedback q={q} grade={grade} />
          <button type="button" onClick={() => { setGrade(null); setSel(emptySelection(q)); }} className="text-sm font-semibold text-accent-ink underline-offset-2 hover:underline">
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

export function LessonChecks({ checks }: { checks: ClientQuestion[] }) {
  return (
    <div className="space-y-4">
      {checks.map((q, i) => <Check key={q.id} q={q} n={i + 1} />)}
    </div>
  );
}
