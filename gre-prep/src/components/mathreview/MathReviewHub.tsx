'use client';

import Link from 'next/link';
import { BookOpen, CheckCircle2, ChevronRight, PencilRuler } from 'lucide-react';
import { PART_CHAPTER, PART_LABEL, type MathPart } from '@/lib/mathreview';
import { exerciseKey, useExerciseProgress } from '@/lib/mathreview-progress';

/* The four parts of the ETS Math Review, each with its exercise set and a link
 * to the Learn chapter that teaches it. */

export function MathReviewHub({ parts: PARTS }: { parts: MathPart[] }) {
  const { progress } = useExerciseProgress();
  const total = PARTS.reduce((a, p) => a + p.exercises.length, 0);
  const done = Object.values(progress).filter((v) => v === 'ok').length;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 pb-10 sm:px-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
      <div>
        <h1 className="flex items-center gap-2.5 text-3xl font-extrabold tracking-tight">
          <PencilRuler className="h-7 w-7 text-accent-ink" aria-hidden />
          Math Review exercises
        </h1>
        <p className="mt-1 max-w-prose text-muted">
          The {total} exercises of the ETS <em>GRE Math Review</em>, with the official worked answers. Try each on paper, reveal the
          answer, and say whether you had it. The lessons that teach them are in Learn.
        </p>
      </div>

      <div className="rounded-[var(--radius)] border border-line bg-surface p-4">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-muted">Exercises you got right</span>
          <span className="font-semibold tabular-nums">
            {done} / {total}
          </span>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-2">
          <div className="h-full rounded-full bg-good transition-all" style={{ width: `${total ? (done / total) * 100 : 0}%` }} />
        </div>
      </div>

      {PARTS.map((part, i) => {
        const ok = part.exercises.filter((e) => progress[exerciseKey(part.id, e.n)] === 'ok').length;
        const review = part.exercises.filter((e) => progress[exerciseKey(part.id, e.n)] === 'review').length;
        return (
          <section key={part.id} className="overflow-hidden rounded-[var(--radius)] border border-line bg-surface">
            <Link
              href={`/math-review/exercises/${part.id}`}
              className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-surface-2"
            >
              {ok === part.exercises.length ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-good" aria-hidden />
              ) : (
                <PencilRuler className="h-5 w-5 shrink-0 text-accent-ink" aria-hidden />
              )}
              <span className="flex-1">
                <span className="block font-bold">
                  Part {i + 1} · {PART_LABEL[part.id]}
                </span>
                <span className="block text-sm text-muted">
                  {part.exercises.length} exercises · {ok} right{review > 0 && ` · ${review} to review`}
                </span>
              </span>
              <ChevronRight className="h-4 w-4 text-faint" aria-hidden />
            </Link>
            <Link
              href={`/learn/${PART_CHAPTER[part.id]}`}
              className="flex items-center gap-3 border-t border-line px-5 py-3 text-sm text-muted transition-colors hover:bg-surface-2 hover:text-fg"
            >
              <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
              <span className="flex-1">Study the lessons for this part</span>
              <ChevronRight className="h-4 w-4 text-faint" aria-hidden />
            </Link>
          </section>
        );
      })}
    </div>
  );
}
