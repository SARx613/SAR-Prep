'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, RotateCcw, X } from 'lucide-react';
import { exerciseKey, useExerciseProgress } from '@/lib/mathreview-progress';
import { PART_CHAPTER, PART_LABEL, type MathPart } from '@/lib/mathreview';
import { RichText } from './RichText';

/* A part's exercises, one at a time. The book gives worked answers rather
 * than something to type against, so the loop is: try it on paper, reveal the
 * answer, say whether you had it. "To review" exercises stay marked. */

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');
const card = 'rounded-[var(--radius)] border border-line bg-surface p-5 sm:p-6';

export function ExerciseDeck({ part }: { part: MathPart }) {
  const { progress, setExercise, resetPart } = useExerciseProgress();
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const ex = part.exercises[index];
  const status = progress[exerciseKey(part.id, ex.n)];
  const total = part.exercises.length;
  const ok = part.exercises.filter((e) => progress[exerciseKey(part.id, e.n)] === 'ok').length;

  const goto = (i: number) => {
    setIndex(Math.min(total - 1, Math.max(0, i)));
    setRevealed(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const grade = (s: 'ok' | 'review') => {
    setExercise(part.id, ex.n, s);
    if (index + 1 < total) goto(index + 1);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 pb-10 sm:px-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/math-review" className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-fg">
          <ArrowLeft className="h-4 w-4" aria-hidden /> Math Review exercises
        </Link>
        <button
          onClick={() => {
            if (confirm('Erase your progress on these exercises?')) resetPart(part.id);
          }}
          className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-line px-3 py-2 text-sm transition-colors hover:bg-surface-2"
        >
          <RotateCcw className="h-4 w-4" aria-hidden /> Reset
        </button>
      </div>

      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">Exercises — {PART_LABEL[part.id]}</h1>
        <p className="mt-1 text-sm text-muted">
          {ok} / {total} right · try it on paper, then reveal the answer.{' '}
          <Link href={`/learn/${PART_CHAPTER[part.id]}`} className="text-accent-ink underline underline-offset-2">
            Need the lesson?
          </Link>
        </p>
      </header>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Exercises">
        {part.exercises.map((e, i) => {
          const st = progress[exerciseKey(part.id, e.n)];
          return (
            <button
              key={e.n}
              onClick={() => goto(i)}
              aria-label={`Exercise ${e.n}`}
              aria-current={i === index ? 'true' : undefined}
              className={cx(
                'h-9 min-w-9 rounded-lg border px-2 text-sm font-semibold tabular-nums transition-colors',
                st === 'ok' && 'border-good bg-good-soft text-good',
                st === 'review' && 'border-warn bg-warn-soft text-warn',
                !st && 'border-line bg-surface-2 text-muted hover:bg-surface',
                i === index && 'ring-2 ring-accent',
              )}
            >
              {e.n}
            </button>
          );
        })}
      </div>

      <div className={cx(card, 'space-y-3')}>
        <p className="text-xs font-semibold uppercase tracking-wide text-faint">Exercise {ex.n}</p>
        <RichText text={ex.q} figure={ex.figure} />
      </div>

      {revealed && (
        <div className={cx(card, 'space-y-3 border-good bg-good-soft')}>
          <p className="text-xs font-semibold uppercase tracking-wide text-good">Answer</p>
          <RichText text={ex.a} />
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <button
          onClick={() => setRevealed((r) => !r)}
          className="inline-flex items-center gap-2 rounded-[var(--radius)] bg-accent px-5 py-3 font-semibold text-accent-fg"
        >
          {revealed ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          {revealed ? 'Hide the answer' : 'Show the answer'}
        </button>

        {revealed && (
          <div className="flex gap-2">
            <button
              onClick={() => grade('review')}
              className={cx(
                'inline-flex items-center gap-2 rounded-[var(--radius)] border px-4 py-3 font-semibold transition-colors',
                status === 'review' ? 'border-warn bg-warn-soft text-warn' : 'border-line hover:bg-surface-2',
              )}
            >
              <X className="h-4 w-4" aria-hidden /> To review
            </button>
            <button
              onClick={() => grade('ok')}
              className={cx(
                'inline-flex items-center gap-2 rounded-[var(--radius)] border px-4 py-3 font-semibold transition-colors',
                status === 'ok' ? 'border-good bg-good-soft text-good' : 'border-line hover:bg-surface-2',
              )}
            >
              <Check className="h-4 w-4" aria-hidden /> Got it
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => goto(index - 1)}
          disabled={index === 0}
          className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-line px-4 py-2.5 text-sm transition-colors hover:bg-surface-2 disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden /> Previous
        </button>
        <button
          onClick={() => goto(index + 1)}
          disabled={index === total - 1}
          className="inline-flex items-center gap-2 rounded-[var(--radius)] border border-line px-4 py-2.5 text-sm transition-colors hover:bg-surface-2 disabled:opacity-40"
        >
          Next <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
