import { Word, UserProgress, WordSeries, SeriesStat } from '@/types';
import { SERIES as THEMED_SERIES, SERIES_SIZE, THEME_LABEL } from './series-data';
import { BOOK_IDS, EASY_IDS } from './vocab-extras';
import { dueIds, type SrsState } from './word-srs';
import { notifyLocalChange } from '@/hooks/useLocalValue';

export { SERIES_SIZE, THEME_LABEL };

const EASY = new Set<number>(EASY_IDS);
const chunk = (ids: readonly number[], title: string, id: string, themeId: string): WordSeries[] =>
  Array.from({ length: Math.ceil(ids.length / SERIES_SIZE) }, (_, i) => ({
    id: `${id}-${i + 1}`,
    themeId,
    title: `${title} ${i + 1}`,
    wordIds: ids.slice(i * SERIES_SIZE, (i + 1) * SERIES_SIZE),
  }));

/** The themed series without the easy cognates, then the words added from the
 *  official books, then quick skim sets of the easy ones. */
export const SERIES: WordSeries[] = [
  ...THEMED_SERIES
    .map(s => ({ ...s, wordIds: s.wordIds.filter(id => !EASY.has(id)) }))
    .filter(s => s.wordIds.length > 0),
  ...chunk(BOOK_IDS, 'Words from the official books', 'book', 'book'),
  ...chunk(EASY_IDS, 'Quick skim: easy for French speakers', 'easy', 'easy'),
];

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
    title: 'Words to review',
    wordIds: progress.reviewIds.slice(0, SERIES_SIZE),
  };
}

/** New words per daily session: the research on vocabulary learning favours short
 *  batches over long lists (about 8–12 new words a day). */
export const DAILY_NEW = 10;

/** Today's session: reviews that are due first, then a few new words taken in
 *  turn from different themes (mixing themes avoids interference between look-alike
 *  words; contrast drills come later, once a word is stable). */
export function dailySeries(srs: SrsState, now: number): WordSeries | null {
  const due = dueIds(srs, now).slice(0, SERIES_SIZE);
  const pools = new Map<string, number[]>();
  for (const s of SERIES) {
    if (s.themeId === 'easy') continue;
    for (const id of s.wordIds) {
      if (srs[id]) continue;
      (pools.get(s.themeId) ?? pools.set(s.themeId, []).get(s.themeId)!).push(id);
    }
  }
  const lists = [...pools.values()];
  const fresh: number[] = [];
  for (let round = 0; fresh.length < DAILY_NEW && lists.some(l => l.length > round); round++) {
    for (const l of lists) {
      if (fresh.length >= DAILY_NEW) break;
      if (l[round] !== undefined) fresh.push(l[round]);
    }
  }
  const ids = [...due, ...fresh];
  if (ids.length === 0) return null;
  return { id: 'daily', themeId: 'daily', title: "Today's session", wordIds: ids };
}

/** How many of today's words are reviews and how many are new. */
export function dailyCounts(srs: SrsState, now: number): { due: number; fresh: number } {
  const d = dailySeries(srs, now);
  if (!d) return { due: 0, fresh: 0 };
  const due = d.wordIds.filter(id => srs[id]).length;
  return { due, fresh: d.wordIds.length - due };
}
