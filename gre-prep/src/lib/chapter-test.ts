/* Client-safe chapter test builder: picks a fresh randomized set of up to 20
 * questions across a chapter's lessons, filtered by difficulty range. */

import type { ClientQuestion } from '@/content/types';
import { Rng, hashSeed } from './generators/rng';

export interface ChapterTestOptions {
  dMin?: number;
  dMax?: number;
  seed?: string | number;
  limit?: number;
}

const DEFAULT_LIMIT = 20;

function clampDiff(v: number | undefined, fallback: number): number {
  if (typeof v !== 'number' || Number.isNaN(v)) return fallback;
  return Math.min(5, Math.max(1, Math.round(v)));
}

function groupKey(q: ClientQuestion): string | null {
  if (q.passageId) return `p:${q.passageId}`;
  if (q.figureSpec) return `f:${JSON.stringify(q.figureSpec)}`;
  return null;
}

function shuffleWithRng<T>(xs: readonly T[], rng: Rng): T[] {
  const out = [...xs];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Picks up to `limit` (default 20) questions from `pool`, filtered to
 * `[dMin, dMax]` (falling back to the full pool if empty), balanced round-robin
 * across lessons, and deterministic for a given `seed`.
 */
export function pickChapterTest(
  pool: readonly ClientQuestion[],
  opts: ChapterTestOptions = {},
): ClientQuestion[] {
  if (pool.length === 0) return [];

  const dMin = clampDiff(opts.dMin, 1);
  const dMax = Math.max(dMin, clampDiff(opts.dMax, 5));
  const limit = Math.max(1, opts.limit ?? DEFAULT_LIMIT);
  const seedKey = opts.seed !== undefined ? String(opts.seed) : `${Date.now()}-${Math.random()}`;
  const rng = new Rng(hashSeed(seedKey));

  const filtered = pool.filter((q) => q.difficulty >= dMin && q.difficulty <= dMax);
  const activePool = filtered.length > 0 ? filtered : pool;

  // Preserve lesson order from `pool`, grouping questions by lessonId.
  const byLesson = new Map<string, ClientQuestion[]>();
  for (const q of activePool) {
    let arr = byLesson.get(q.lessonId);
    if (!arr) {
      arr = [];
      byLesson.set(q.lessonId, arr);
    }
    arr.push(q);
  }

  // Within each lesson, keep questions sharing a passage or figure together, then shuffle groups.
  const lists: ClientQuestion[][] = [];
  for (const qs of byLesson.values()) {
    const groups = new Map<string, ClientQuestion[]>();
    for (const q of qs) {
      const k = groupKey(q) ?? `id:${q.id}`;
      let g = groups.get(k);
      if (!g) {
        g = [];
        groups.set(k, g);
      }
      g.push(q);
    }
    const shuffledGroups = shuffleWithRng([...groups.values()], rng);
    lists.push(shuffledGroups.flatMap((g) => shuffleWithRng(g, rng)));
  }

  const picked: ClientQuestion[] = [];
  const maxLen = Math.max(0, ...lists.map((l) => l.length));
  for (let round = 0; picked.length < limit && round < maxLen; round++) {
    for (const l of lists) {
      if (picked.length < limit && l[round]) picked.push(l[round]);
    }
  }

  // Keep any selected RC/DI questions sharing a passage or figure adjacent.
  const ordered: ClientQuestion[] = [];
  const grouped = new Map<string, ClientQuestion[]>();
  for (const q of picked) {
    const k = groupKey(q) ?? `id:${q.id}`;
    let g = grouped.get(k);
    if (!g) {
      g = [];
      grouped.set(k, g);
    }
    g.push(q);
  }
  for (const g of grouped.values()) ordered.push(...g);
  return ordered;
}
