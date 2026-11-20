'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Shuffle } from 'lucide-react';

interface Props {
  chapterId: string;
  chapterTitle: string;
  countsByDifficulty: Record<number, number>;
}

const PRESETS: readonly { label: string; min: number; max: number }[] = [
  { label: 'All (1–5)', min: 1, max: 5 },
  { label: 'Levels 1–4', min: 1, max: 4 },
  { label: 'Levels 2–4', min: 2, max: 4 },
  { label: 'Levels 3–5', min: 3, max: 5 },
  { label: 'Levels 4–5', min: 4, max: 5 },
];

export function ChapterTestCard({ chapterId, chapterTitle, countsByDifficulty }: Props) {
  const router = useRouter();
  const [dMin, setDMin] = useState(1);
  const [dMax, setDMax] = useState(5);

  const matchingCount = [1, 2, 3, 4, 5]
    .filter((d) => d >= dMin && d <= dMax)
    .reduce((sum, d) => sum + (countsByDifficulty[d] ?? 0), 0);
  const drawCount = Math.min(20, matchingCount);

  const start = () => {
    const seed = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    router.push(`/exam/chapter-${chapterId}?min=${dMin}&max=${dMax}&seed=${seed}`);
  };

  return (
    <section
      aria-label={`Chapter test for ${chapterTitle}`}
      className="mt-5 rounded-[var(--radius)] border border-line-strong bg-surface p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-bold">
            <Shuffle size={16} className="text-accent-ink" aria-hidden />
            Chapter test · timed, up to 20 questions
          </h2>
          <p className="mt-1 text-sm text-muted">
            New random draw across all lessons in this chapter each time you start.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Difficulty presets">
          {PRESETS.map((p) => {
            const active = dMin === p.min && dMax === p.max;
            return (
              <button
                key={p.label}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setDMin(p.min);
                  setDMax(p.max);
                }}
                className={`min-h-[40px] rounded-full border px-3.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'border-accent bg-accent text-accent-fg'
                    : 'border-line-strong bg-surface text-muted hover:text-fg'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="text-xs font-bold uppercase tracking-wide text-faint">Difficulty</span>
          <label className="flex items-center gap-2">
            From
            <select
              aria-label="Minimum difficulty"
              value={dMin}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDMin(v);
                if (v > dMax) setDMax(v);
              }}
              className="h-10 rounded-[var(--radius)] border border-line-strong bg-surface px-2 font-semibold"
            >
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2">
            to
            <select
              aria-label="Maximum difficulty"
              value={dMax}
              onChange={(e) => {
                const v = Number(e.target.value);
                setDMax(v);
                if (v < dMin) setDMin(v);
              }}
              className="h-10 rounded-[var(--radius)] border border-line-strong bg-surface px-2 font-semibold"
            >
              {[1, 2, 3, 4, 5].map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <p className="text-sm text-muted" aria-live="polite">
          {matchingCount > 0 ? (
            <>
              <strong className="text-fg">{matchingCount}</strong> matching question
              {matchingCount === 1 ? '' : 's'} · you’ll get{' '}
              <strong className="text-fg">{drawCount}</strong>
            </>
          ) : (
            'No questions in this exact level range — all chapter levels will be used.'
          )}
        </p>
        <button
          type="button"
          onClick={start}
          className="inline-flex h-11 items-center gap-2 rounded-[var(--radius)] bg-accent px-5 text-sm font-bold text-accent-fg hover:opacity-95"
        >
          <Play size={16} aria-hidden />
          Take chapter test
        </button>
      </div>
    </section>
  );
}
