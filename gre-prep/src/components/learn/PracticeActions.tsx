'use client';

import Link from 'next/link';
import { answeredBefore } from '@/lib/attempts';
import { useAttempts } from '@/hooks/useAttempts';

/* The lesson's practice buttons: start, continue where you stopped, or go again. */
export function PracticeActions({ lessonId, qids }: { lessonId: string; qids: string[] }) {
  const attempts = useAttempts();
  const before = answeredBefore(attempts, qids);
  const done = before.size;
  const total = qids.length;
  const next = qids.findIndex((id) => !before.has(id)) + 1;
  const partial = done > 0 && done < total;
  const primary = 'inline-flex h-11 items-center rounded-[var(--radius)] bg-accent px-5 text-sm font-bold text-accent-fg';
  return (
    <div className="mt-4">
      {done > 0 && (
        <p className="mb-3 text-sm text-muted">
          {partial ? `${done} of ${total} answered. Next: question ${next}.` : `All ${total} questions answered.`}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Link href={`/exam/${lessonId}?mode=tutor`} className={primary}>
          {partial ? `Continue at question ${next}` : done === total && total > 0 ? 'Practice again' : 'Practice with explanations'}
        </Link>
        <Link href={`/exam/${lessonId}?mode=timed`} className="inline-flex h-11 items-center rounded-[var(--radius)] border border-line-strong px-5 text-sm font-semibold">Timed, like the test</Link>
      </div>
    </div>
  );
}
