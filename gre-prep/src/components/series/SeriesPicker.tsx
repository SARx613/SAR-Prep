'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Check, RotateCcw, Target } from 'lucide-react';
import { WordSeries } from '@/types';
import { defaultProgress, parseProgress, PROGRESS_KEY } from '@/lib/storage';
import { useLocalValue } from '@/hooks/useLocalValue';
import {
  SERIES, masteredCount, reviewSeries, parseSeriesStats,
  SERIES_STATS_KEY, NO_SERIES_STATS,
} from '@/lib/series';

type Filter = 'all' | 'todo' | 'ongoing' | 'done';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'ongoing', label: 'En cours' },
  { id: 'todo', label: 'Nouvelles' },
  { id: 'done', label: 'Maîtrisées' },
];

/* One accent per theme, cycled, so neighbouring cards stay distinguishable
   at a glance without inventing a colour per theme. */
const ACCENTS = ['var(--violet)', 'var(--emerald)', 'var(--amber)', '#38bdf8'];

interface Props {
  /** Where a series card leads: `${basePath}/${series.id}`. */
  basePath: string;
  title: string;
  icon: React.ReactNode;
  accent: string;
  /** One line under the title explaining what this mode does. */
  subtitle: string;
}

export function SeriesPicker({ basePath, title, icon, accent, subtitle }: Props) {
  // Progress and history live in localStorage; read as an external store so
  // the grid paints with the real numbers on first render.
  const progress = useLocalValue(PROGRESS_KEY, parseProgress, defaultProgress);
  const stats = useLocalValue(SERIES_STATS_KEY, parseSeriesStats, NO_SERIES_STATS);
  const [filter, setFilter] = useState<Filter>('all');

  const review = reviewSeries(progress);

  const shown = useMemo(() => {
    if (filter === 'all') return SERIES;
    return SERIES.filter(s => {
      const mastered = masteredCount(s, progress);
      const rounds = stats[s.id]?.rounds ?? 0;
      if (filter === 'done') return mastered === s.wordIds.length;
      if (filter === 'todo') return rounds === 0 && mastered === 0;
      return (rounds > 0 || mastered > 0) && mastered < s.wordIds.length;
    });
  }, [filter, progress, stats]);

  const totalMastered = progress.masteredIds.length;
  const totalWords = SERIES.reduce((n, s) => n + s.wordIds.length, 0);

  return (
    <main className="page">
      <div style={{ position: 'fixed', top: '10%', right: '5%', width: '35vh', height: '35vh', background: accent, borderRadius: '50%', filter: 'blur(130px)', opacity: 0.1, zIndex: -1 }} className="animate-float" />

      <div className="page-container">

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem' }} className="animate-fade-up page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <Link href="/" className="back-link">
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
              {icon}
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
            </div>
          </div>

          <div className="glass queue-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.9rem', borderRadius: 99, flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span style={{ width: 7, height: 7, background: accent, borderRadius: '50%', boxShadow: `0 0 10px ${accent}`, display: 'inline-block' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>
              {totalMastered} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>/ {totalWords} mots</span>
            </span>
          </div>
        </header>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 1.5rem 0', maxWidth: 620 }}>
          {subtitle}
        </p>

        {/* Review series — only when something is actually waiting */}
        {review && (
          <Link href={`${basePath}/review`} style={{ textDecoration: 'none' }}>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass card-depth"
              style={{ borderRadius: 20, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.9rem', background: 'rgba(244,63,94,0.08)', borderColor: 'rgba(244,63,94,0.25)' }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38, borderRadius: 12, background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', flexShrink: 0 }}>
                <Target size={19} color="var(--rose)" />
              </span>
              <span style={{ minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 800, color: '#fff', fontSize: '0.98rem' }}>Mots à revoir</span>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {review.wordIds.length} mot{review.wordIds.length > 1 ? 's' : ''} ratés, à reprendre maintenant
                </span>
              </span>
            </motion.div>
          </Link>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          {FILTERS.map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="filter-chip"
              style={filter === f.id
                ? { background: accent, color: '#000', borderColor: 'transparent' }
                : undefined}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Series grid */}
        {shown.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Aucune série dans ce filtre.</p>
        ) : (
          <div className="series-grid">
            {shown.map((s, i) => (
              <SeriesCard
                key={s.id}
                series={s}
                href={`${basePath}/${s.id}`}
                accent={ACCENTS[SERIES.indexOf(s) % ACCENTS.length]}
                mastered={masteredCount(s, progress)}
                rounds={stats[s.id]?.rounds ?? 0}
                index={i}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function SeriesCard({
  series, href, accent, mastered, rounds, index,
}: {
  series: WordSeries;
  href: string;
  accent: string;
  mastered: number;
  rounds: number;
  index: number;
}) {
  const total = series.wordIds.length;
  const pct = total > 0 ? (mastered / total) * 100 : 0;
  const complete = mastered === total;

  return (
    <motion.a
      href={href}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      // Cards past the first screen animate on a shared, short delay rather
      // than a per-index one, or the last of 66 would wait five seconds.
      transition={{ delay: Math.min(index, 12) * 0.03 }}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      className="glass card-depth series-card"
      style={{ borderColor: complete ? 'rgba(16,185,129,0.35)' : 'var(--border)' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', lineHeight: 1.3 }}>
          {series.title}
        </span>
        {complete ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.35)', flexShrink: 0 }}>
            <Check size={13} color="var(--emerald)" />
          </span>
        ) : rounds > 0 ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', flexShrink: 0 }}>
            <RotateCcw size={11} /> {rounds}
          </span>
        ) : null}
      </div>

      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
        {total} mots
      </span>

      <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: complete ? 'var(--emerald)' : accent, borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>

      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: complete ? 'var(--emerald)' : 'var(--text-secondary)' }}>
        {mastered}/{total} maîtrisés
      </span>
    </motion.a>
  );
}
