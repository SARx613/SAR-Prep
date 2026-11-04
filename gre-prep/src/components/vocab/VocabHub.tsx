'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowRight, BookOpenCheck, CalendarClock, Check, ChevronDown, RotateCcw, Target } from 'lucide-react';
import type { WordSeries } from '@/types';
import { useLocalValue } from '@/hooks/useLocalValue';
import { defaultProgress, parseProgress, PROGRESS_KEY } from '@/lib/storage';
import { NO_SRS, SRS_KEY, parseSrs } from '@/lib/word-srs';
import {
  NO_SERIES_STATS, SERIES, SERIES_STATS_KEY, dailyCounts, dailySeries, masteredCount, parseSeriesStats, reviewSeries,
} from '@/lib/series';

type Group = 'themes' | 'books' | 'skim';
type Filter = 'all' | 'ongoing' | 'todo' | 'done';

const GROUPS: { id: Group; label: string; hint: string }[] = [
  { id: 'themes', label: 'By theme', hint: 'Words grouped by meaning: praise, deceit, caution…' },
  { id: 'books', label: 'From the official books', hint: 'Words found in the ETS books that the deck was missing.' },
  { id: 'skim', label: 'Quick skim', hint: 'Words you probably already know from French (same word, same meaning). Check them fast, do not drill them.' },
];
const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'ongoing', label: 'In progress' },
  { id: 'todo', label: 'New' },
  { id: 'done', label: 'Mastered' },
];

const groupOf = (s: WordSeries): Group => (s.themeId === 'book' ? 'books' : s.themeId === 'easy' ? 'skim' : 'themes');
const card = 'rounded-[var(--radius)] border border-line bg-surface';

function Ring({ value, size = 72 }: { value: number; size?: number }) {
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(value * 100)} percent`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--line)" strokeWidth="8" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--accent)" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - Math.min(1, value))} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" className="fill-current text-fg" style={{ fontSize: size * 0.24, fontWeight: 800 }}>
        {Math.round(value * 100)}%
      </text>
    </svg>
  );
}

export function VocabHub() {
  const progress = useLocalValue(PROGRESS_KEY, parseProgress, defaultProgress);
  const stats = useLocalValue(SERIES_STATS_KEY, parseSeriesStats, NO_SERIES_STATS);
  const srs = useLocalValue(SRS_KEY, parseSrs, NO_SRS);
  const [now] = useState(() => Date.now());
  const [group, setGroup] = useState<Group>('themes');
  const [filter, setFilter] = useState<Filter>('all');

  const daily = dailySeries(srs, now);
  const counts = dailyCounts(srs, now);
  const review = reviewSeries(progress);
  const totalWords = useMemo(() => new Set(SERIES.flatMap((s) => s.wordIds)).size, []);
  const learned = new Set(progress.masteredIds).size;

  const shown = useMemo(
    () => SERIES.filter((s) => groupOf(s) === group).filter((s) => {
      const mastered = masteredCount(s, progress);
      const rounds = stats[s.id]?.rounds ?? 0;
      if (filter === 'done') return mastered === s.wordIds.length;
      if (filter === 'todo') return rounds === 0 && mastered === 0;
      if (filter === 'ongoing') return (rounds > 0 || mastered > 0) && mastered < s.wordIds.length;
      return true;
    }),
    [group, filter, progress, stats],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 pb-12 sm:px-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
      <header className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-extrabold tracking-tight">Vocabulary</h1>
          <p className="mt-1 max-w-prose text-muted">{totalWords} words, learned a little every day with spaced repetition.</p>
        </div>
        <div className="shrink-0 text-center">
          <Ring value={totalWords ? learned / totalWords : 0} />
          <p className="mt-1 text-xs text-muted">{learned} learned</p>
        </div>
      </header>

      {/* Today */}
      <section className={`${card} mt-6 border-accent/40 p-5 sm:p-6`} aria-labelledby="today">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-ink"><CalendarClock size={24} aria-hidden /></span>
          <div className="min-w-0 flex-1">
            <h2 id="today" className="text-xl font-bold">Today&apos;s session</h2>
            {daily ? (
              <p className="mt-0.5 text-sm text-muted">
                {counts.due} review{counts.due === 1 ? '' : 's'} + {counts.fresh} new word{counts.fresh === 1 ? '' : 's'} · about {Math.max(5, Math.round(daily.wordIds.length * 0.7))} minutes
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-muted">Nothing due and every word has been started. Come back tomorrow.</p>
            )}
          </div>
          {daily && (
            <Link href="/flashcards/daily" className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-accent px-6 text-base font-bold text-accent-fg sm:w-auto">
              Start <ArrowRight size={18} aria-hidden />
            </Link>
          )}
        </div>
        {review && (
          <Link href="/flashcards/review" className="mt-4 flex items-center gap-3 rounded-[var(--radius)] bg-bad-soft px-4 py-3 text-sm hover:opacity-90">
            <Target size={18} className="shrink-0 text-bad" aria-hidden />
            <span className="min-w-0 flex-1"><strong>{review.wordIds.length} missed word{review.wordIds.length === 1 ? '' : 's'}</strong> <span className="text-muted">ready to replay</span></span>
            <ArrowRight size={16} className="shrink-0 text-muted" aria-hidden />
          </Link>
        )}
      </section>

      <details className={`${card} group mt-4`}>
        <summary className="flex min-h-[48px] cursor-pointer list-none items-center gap-3 px-5 py-3 text-sm font-semibold">
          <BookOpenCheck size={18} className="text-accent-ink" aria-hidden /> How the sessions work
          <ChevronDown size={16} className="ml-auto text-muted transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <ul className="list-disc space-y-2 px-5 pb-5 pl-9 text-sm text-muted">
          <li>Each day: the reviews that are due, then about 10 new words taken from different themes (similar words learned together get mixed up).</li>
          <li>A word comes back after 1, 3, 7, 14 and 30 days. Miss it and it comes back tomorrow.</li>
          <li>Questions get harder as a word settles: pick the definition, then complete a sentence, then type the word.</li>
          <li>Short daily sessions beat long ones. Ten minutes a day is enough.</li>
        </ul>
      </details>

      {/* Series */}
      <section className="mt-8" aria-labelledby="series">
        <h2 id="series" className="text-lg font-bold">Browse the words</h2>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Word groups">
          {GROUPS.map((g) => (
            <button key={g.id} role="tab" aria-selected={group === g.id} onClick={() => setGroup(g.id)}
              className={`min-h-[40px] shrink-0 rounded-full border px-4 text-sm font-semibold ${group === g.id ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong bg-surface text-muted hover:text-fg'}`}>
              {g.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted">{GROUPS.find((g) => g.id === group)?.hint}</p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Filter">
          {FILTERS.map((f) => (
            <button key={f.id} aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}
              className={`min-h-[34px] rounded-full border px-3 text-xs font-semibold ${filter === f.id ? 'border-accent-ink bg-accent-soft text-accent-ink' : 'border-line bg-surface text-muted hover:text-fg'}`}>
              {f.label}
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className="mt-6 text-sm text-muted">Nothing here yet.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((s) => {
              const total = s.wordIds.length;
              const mastered = masteredCount(s, progress);
              const rounds = stats[s.id]?.rounds ?? 0;
              const complete = total > 0 && mastered === total;
              return (
                <li key={s.id}>
                  <Link href={`/flashcards/${s.id}`} className={`${card} flex h-full min-h-[112px] flex-col gap-2 p-4 transition-colors hover:border-line-strong ${complete ? 'border-good/50' : ''}`}>
                    <span className="flex items-start justify-between gap-2">
                      <span className="font-bold leading-snug">{s.title}</span>
                      {complete ? <Check size={18} className="shrink-0 text-good" aria-label="Mastered" />
                        : rounds > 0 ? <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-muted"><RotateCcw size={12} aria-hidden />{rounds}</span> : null}
                    </span>
                    <span className="text-xs text-muted">{total} words</span>
                    <span className="mt-auto block h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
                      <span className="block h-full rounded-full bg-accent" style={{ width: `${total ? (mastered / total) * 100 : 0}%` }} />
                    </span>
                    <span className="text-xs font-semibold text-muted">{mastered} / {total} mastered</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
