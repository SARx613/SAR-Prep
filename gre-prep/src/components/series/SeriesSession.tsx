'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2, RotateCcw, Target, Trophy, List } from 'lucide-react';
import { Word } from '@/types';
import { useGameLoop, PlayMode } from '@/hooks/useGameLoop';
import { useLocalValue } from '@/hooks/useLocalValue';
import { GameCard } from '@/components/GameCard';
import { defaultProgress, parseProgress, PROGRESS_KEY } from '@/lib/storage';
import { getSeries, nextSeries, recordSeriesRun, reviewSeries } from '@/lib/series';

const PLAY_MODES: { id: PlayMode; label: string }[] = [
  { id: 'mcq', label: 'QCM' },
  { id: 'typing', label: 'Frappe' },
  { id: 'mix', label: 'Mix' },
];

const MODE_KEY = 'gre-prep-play-mode';

function parseMode(raw: string | null): PlayMode | null {
  return PLAY_MODES.some(m => m.id === raw) ? (raw as PlayMode) : null;
}

interface Props {
  seriesId: string;
  /** Fixed mode (flashcards), or the initial one when `modeToggle` is set. */
  playMode: PlayMode;
  /** Where the series list lives, e.g. "/flashcards". */
  basePath: string;
  accent: string;
  icon: React.ReactNode;
  /** Practice offers QCM / Frappe / Mix; flashcards are always flashcards. */
  modeToggle?: boolean;
}

export function SeriesSession({ seriesId, playMode, basePath, accent, icon, modeToggle }: Props) {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);

  // The practice mode is remembered between sessions; a click this session
  // wins over what was stored.
  const savedMode = useLocalValue(MODE_KEY, parseMode, null);
  const [pickedMode, setPickedMode] = useState<PlayMode | null>(null);
  const mode = modeToggle ? (pickedMode ?? savedMode ?? playMode) : playMode;

  // "review" is not a stored series but a view of the words currently
  // flagged wrong. It reads progress from storage, which nothing in this
  // session re-broadcasts, so the queue stays put while the run is on.
  const progressSnapshot = useLocalValue(PROGRESS_KEY, parseProgress, defaultProgress);
  const series = useMemo(
    () => (seriesId === 'review' ? reviewSeries(progressSnapshot) : getSeries(seriesId) ?? null),
    [seriesId, progressSnapshot],
  );

  useEffect(() => {
    fetch('/words.json')
      .then(res => res.json())
      .then((data: Word[]) => { setWords(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const wordIds = useMemo(() => series?.wordIds ?? [], [series]);

  const {
    progress, state, handleAnswer, nextTurn, flipCard, setQuestionMode,
    done, result, answeredCount, restart,
  } = useGameLoop(words, mode, wordIds);

  // One run, one entry in the history — and only for a full pass of a real
  // series, so replaying just the misses does not inflate the count.
  const recorded = useRef(false);
  useEffect(() => {
    if (!done || !result || !series || series.id === 'review') return;
    if (result.total !== series.wordIds.length) return;
    if (recorded.current) return;
    recorded.current = true;
    recordSeriesRun(series.id, result.correct);
  }, [done, result, series]);

  const replay = (ids?: number[]) => {
    recorded.current = false;
    restart(ids);
  };

  const chooseMode = (m: PlayMode) => {
    setPickedMode(m);
    setQuestionMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      // Private mode: the choice still holds for this session.
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
          <Loader2 size={48} color={accent} />
        </motion.div>
      </div>
    );
  }

  if (!series || series.wordIds.length === 0) {
    return (
      <main className="page">
        <div className="page-container" style={{ textAlign: 'center', paddingTop: '4rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>
            {seriesId === 'review' ? 'Rien à revoir' : 'Série introuvable'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            {seriesId === 'review'
              ? 'Aucun mot raté pour le moment. Fais une série, on remplira cette liste.'
              : 'Cette série n’existe pas (ou plus).'}
          </p>
          <Link href={basePath} className="back-link">
            <ArrowLeft size={14} /> Toutes les séries
          </Link>
        </div>
      </main>
    );
  }

  const total = result?.total ?? series.wordIds.length;
  const pct = total > 0 ? (answeredCount / total) * 100 : 0;
  const upcoming = nextSeries(series.id);

  return (
    <main className="page">
      <div style={{ position: 'fixed', top: '10%', right: '5%', width: '35vh', height: '35vh', background: accent, borderRadius: '50%', filter: 'blur(130px)', opacity: 0.1, zIndex: -1 }} className="animate-float" />

      <div className="page-container">

        {/* Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }} className="animate-fade-up page-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 0 }}>
            <Link href={basePath} className="back-link">
              <ArrowLeft size={14} /> Séries
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', minWidth: 0 }}>
              {icon}
              <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {series.title}
              </span>
            </div>
          </div>

          <div className="glass queue-badge" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.9rem', borderRadius: 99, flexShrink: 0, whiteSpace: 'nowrap' }}>
            <span style={{ width: 7, height: 7, background: accent, borderRadius: '50%', boxShadow: `0 0 10px ${accent}`, display: 'inline-block' }} />
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff' }}>
              {Math.min(answeredCount + (done ? 0 : 1), total)} <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>/ {total}</span>
            </span>
          </div>
        </header>

        {/* Mode toggle (practice only) */}
        {modeToggle && !done && (
          <div className="glass game-mode-toggle" style={{ display: 'inline-flex', gap: '0.2rem', padding: '0.3rem', borderRadius: 99, marginBottom: '1.25rem' }}>
            {PLAY_MODES.map(m => (
              <button
                key={m.id}
                onClick={() => chooseMode(m.id)}
                style={{
                  padding: '0.45rem 1.1rem', borderRadius: 99, fontSize: '0.82rem', fontWeight: 700,
                  border: 'none', cursor: 'pointer', transition: 'all 0.25s',
                  background: mode === m.id ? accent : 'transparent',
                  color: mode === m.id ? '#000' : 'var(--text-secondary)',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        )}

        {/* Series progress */}
        <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: '1.75rem' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: accent, borderRadius: 99, transition: 'width 0.4s ease' }} />
        </div>

        {done && result ? (
          <Recap
            result={result}
            accent={accent}
            onReplay={() => replay()}
            onReplayMissed={() => replay(result.missed.map(w => w.id))}
            basePath={basePath}
            nextHref={upcoming ? `${basePath}/${upcoming.id}` : null}
            nextTitle={upcoming?.title ?? null}
          />
        ) : progress && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <GameCard
              state={state}
              onAnswer={handleAnswer}
              onNextTurn={nextTurn}
              onFlip={flipCard}
            />
          </motion.div>
        )}
      </div>
    </main>
  );
}

function Recap({
  result, accent, onReplay, onReplayMissed, basePath, nextHref, nextTitle,
}: {
  result: { total: number; correct: number; missed: Word[] };
  accent: string;
  onReplay: () => void;
  onReplayMissed: () => void;
  basePath: string;
  nextHref: string | null;
  nextTitle: string | null;
}) {
  const pct = result.total > 0 ? Math.round((result.correct / result.total) * 100) : 0;
  const perfect = result.missed.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass card-depth"
      style={{ borderRadius: 28, padding: 'clamp(1.4rem, 5vw, 2.5rem)', maxWidth: 900, margin: '0 auto' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 16, background: perfect ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.12)', border: `1px solid ${perfect ? 'rgba(16,185,129,0.35)' : 'rgba(245,158,11,0.3)'}`, flexShrink: 0 }}>
          <Trophy size={26} color={perfect ? 'var(--emerald)' : 'var(--amber)'} />
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 'clamp(1.3rem, 5vw, 1.8rem)', fontWeight: 900, color: '#fff', lineHeight: 1.2 }}>
            Série terminée
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {result.correct} / {result.total} du premier coup · {pct}%
          </div>
        </div>
      </div>

      <div style={{ width: '100%', height: 10, background: 'rgba(255,255,255,0.05)', borderRadius: 99, overflow: 'hidden', marginBottom: '1.75rem' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: perfect ? 'var(--emerald)' : accent, borderRadius: 99 }}
        />
      </div>

      {result.missed.length > 0 && (
        <div style={{ marginBottom: '1.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--rose)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.85rem' }}>
            <Target size={14} /> À retravailler ({result.missed.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {result.missed.map(w => (
              <div
                key={w.id}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 14, padding: '0.7rem 0.9rem' }}
              >
                {/* Word and translation on one line, definition under it, so
                    every row reads the same way however long the gloss is. */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.98rem' }}>{w.word}</span>
                  <span style={{ fontSize: '0.8rem', color: '#fcd34d', fontWeight: 600, textAlign: 'right' }}>{w.french}</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>{w.definition}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button onClick={onReplay} className="recap-button" style={{ background: '#fff', color: '#000' }}>
          <RotateCcw size={17} /> Rejouer la série
        </button>
        {result.missed.length > 0 && (
          <button onClick={onReplayMissed} className="recap-button" style={{ background: 'rgba(244,63,94,0.12)', color: '#fda4af', border: '1px solid rgba(244,63,94,0.3)' }}>
            <Target size={17} /> Revoir les {result.missed.length} ratés
          </button>
        )}
        {nextHref && (
          <Link href={nextHref} className="recap-button" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid var(--border)', textDecoration: 'none' }}>
            {nextTitle} <ArrowRight size={17} />
          </Link>
        )}
        <Link href={basePath} className="recap-button" style={{ background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', textDecoration: 'none' }}>
          <List size={17} /> Toutes les séries
        </Link>
      </div>
    </motion.div>
  );
}
