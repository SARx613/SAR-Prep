import { Word, UserProgress, WordSeries, SeriesStat } from '@/types';
import { SERIES, SERIES_SIZE, THEME_LABEL } from './series-data';
import { notifyLocalChange } from '@/hooks/useLocalValue';

export { SERIES, SERIES_SIZE, THEME_LABEL };

export const SERIES_STATS_KEY = 'gre-prep-series-stats';

/** Stable empty table, for server rendering and for a first visit. */
export const NO_SERIES_STATS: SeriesStats = {};

export function getSeries(id: string): WordSeries | undefined {
  return SERIES.find(s => s.id === id);
}

/** The series after this one, for the "suivante" button at the end of a run. */
export function nextSeries(id: string): WordSeries | undefined {
  const i = SERIES.findIndex(s => s.id === id);
  return i >= 0 ? SERIES[i + 1] : undefined;
}

/** Resolves a series to its deck words, in series order.
 *  Words the deck no longer has are dropped rather than left as holes. */
export function seriesWords(series: WordSeries, words: Word[]): Word[] {
  const byId = new Map(words.map(w => [w.id, w]));
  return series.wordIds
    .map(id => byId.get(id))
    .filter((w): w is Word => w !== undefined);
}

/** How many of the series' words currently count as mastered. */
export function masteredCount(series: WordSeries, progress: UserProgress | null): number {
  if (!progress) return 0;
  const mastered = new Set(progress.masteredIds);
  return series.wordIds.filter(id => mastered.has(id)).length;
}

/** How many of the series' words are flagged for review. */
export function reviewCount(series: WordSeries, progress: UserProgress | null): number {
  if (!progress) return 0;
  const review = new Set(progress.reviewIds);
  return series.wordIds.filter(id => review.has(id)).length;
}

/* ── Per-series history ──────────────────────────────────────────────────
   Kept in localStorage only. Mastery already syncs to the cloud through
   UserProgress; this is just the "how many times have I run this series"
   counter that makes repetition visible, and it is not worth a schema
   change or a round trip. */

export type SeriesStats = Record<string, SeriesStat>;

export function parseSeriesStats(raw: string | null): SeriesStats {
  if (!raw) return NO_SERIES_STATS;
  try {
    return JSON.parse(raw) as SeriesStats;
  } catch {
    return NO_SERIES_STATS;
  }
}

export function loadSeriesStats(): SeriesStats {
  if (typeof window === 'undefined') return NO_SERIES_STATS;
  try {
    return parseSeriesStats(localStorage.getItem(SERIES_STATS_KEY));
  } catch {
    return NO_SERIES_STATS;
  }
}

/** Records a finished run and returns the updated table. */
export function recordSeriesRun(seriesId: string, score: number): SeriesStats {
  const stats = loadSeriesStats();
  const prev = stats[seriesId];
  const next: SeriesStat = {
    rounds: (prev?.rounds ?? 0) + 1,
    bestScore: Math.max(prev?.bestScore ?? 0, score),
    lastScore: score,
    lastPlayed: Date.now(),
  };
  const updated = { ...stats, [seriesId]: next };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(SERIES_STATS_KEY, JSON.stringify(updated));
      notifyLocalChange();
    } catch {
      // Storage full or blocked — the run still counted for mastery.
    }
  }
  return updated;
}

export function resetSeriesStats(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SERIES_STATS_KEY);
  notifyLocalChange();
}

/** The words flagged for review, newest series first, capped at one session.
 *  Built on the fly rather than stored: it is a view of progress, not a
 *  series of its own. */
export function reviewSeries(progress: UserProgress | null): WordSeries | null {
  if (!progress || progress.reviewIds.length === 0) return null;
  return {
    id: 'review',
    themeId: 'review',
    title: 'Mots à revoir',
    wordIds: progress.reviewIds.slice(0, SERIES_SIZE),
  };
}
