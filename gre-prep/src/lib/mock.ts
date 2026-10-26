/* Mock tests, the diagnostic, and the score estimate (PLAN §7).
 *
 * Mirrors the real structure: Verbal 12 + 15, Quant 12 + 15. The first
 * section of each measure is of average difficulty; the second is easier,
 * average or harder depending on how the first went (ETS: "section-level
 * adaptive"). Everything is deterministic from the mock number so a mock can
 * be resumed or re-opened and always shows the same questions.
 *
 * The score is OUR estimate from our own question calibration. It is not an
 * ETS score and the UI says so.
 */

import { Rng, hashSeed } from './generators/rng';
import type { QIndexItem } from '@/content/qindex';

export type Section = 'verbal' | 'quant';
export type Level = 'easy' | 'medium' | 'hard';

export const MOCK_COUNT = 6;
export const SECTION_SIZE = { 1: 12, 2: 15 } as const;
/** Minutes allotted by ETS for each section part. */
export const SECTION_MINUTES: Record<Section, { 1: number; 2: number }> = { verbal: { 1: 18, 2: 23 }, quant: { 1: 21, 2: 26 } };

const BAND: Record<Level | 'avg', [number, number]> = { easy: [1, 3], medium: [2, 4], hard: [3, 5], avg: [2, 4] };

type Quotas = Record<string, number>;
const QUOTAS: Record<Section, Record<1 | 2, Quotas>> = {
  verbal: { 1: { TC: 4, SE: 3, RC: 5 }, 2: { TC: 5, SE: 4, RC: 6 } },
  quant: { 1: { QC: 3, PS: 4, NE: 2, DI: 3 }, 2: { QC: 4, PS: 5, NE: 3, DI: 3 } },
};

/** Chapters whose questions can appear in a mock (no strategy/format chapters). */
const MOCK_CHAPTERS: Record<Section, string[]> = { verbal: ['v1', 'v2', 'v3'], quant: ['q1', 'q2', 'q3', 'q4', 'q0'] };

function shuffled<T>(xs: T[], rng: Rng): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = rng.int(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick up to `n` items of a type; RC and DI come in groups that share a passage or figure. */
function pickType(pool: QIndexItem[], type: string, n: number, rng: Rng, taken: Set<string>): string[] {
  const of = shuffled(pool.filter((q) => q.type === type && !taken.has(q.id)), rng);
  const groupKey = (q: QIndexItem) => (type === 'RC' ? q.passageId : type === 'DI' ? q.figureKey : undefined);
  if (type !== 'RC' && type !== 'DI') return of.slice(0, n).map((q) => q.id);

  const groups = new Map<string, QIndexItem[]>();
  for (const q of of) {
    const k = groupKey(q);
    if (!k) continue;
    (groups.get(k) ?? groups.set(k, []).get(k)!).push(q);
  }
  const out: string[] = [];
  for (const g of shuffled([...groups.values()], rng).sort((a, b) => b.length - a.length)) {
    if (out.length >= n) break;
    out.push(...g.slice(0, Math.min(3, n - out.length)).map((q) => q.id));
  }
  return out;
}

export function buildPart(index: QIndexItem[], section: Section, part: 1 | 2, level: Level | 'avg', seed: string, exclude: Set<string> = new Set()): string[] {
  const [lo, hi] = BAND[part === 1 ? 'avg' : level];
  const chapters = MOCK_CHAPTERS[section];
  const base = index.filter((q) => q.section === section && chapters.includes(q.chapter));
  const inBand = base.filter((q) => q.difficulty >= lo && q.difficulty <= hi);
  const rng = new Rng(hashSeed(`${seed}:${section}:${part}:${level}`));
  const taken = new Set(exclude);
  const ids: string[] = [];
  const size = SECTION_SIZE[part];

  for (const [type, n] of Object.entries(QUOTAS[section][part])) {
    for (const id of pickType(inBand, type, n, rng, taken)) { ids.push(id); taken.add(id); }
  }
  // Top up from the band, then from the whole section, if a type ran short.
  for (const pool of [inBand, base]) {
    for (const q of shuffled(pool, rng)) {
      if (ids.length >= size) break;
      if (!taken.has(q.id)) { ids.push(q.id); taken.add(q.id); }
    }
  }
  return ids.slice(0, size);
}

export const mockSeed = (kind: string) => `mock:${kind}`;

/** The second section's level from the first section's result. */
export function levelFor(correct: number, total: number): Level {
  const f = total ? correct / total : 0;
  return f >= 0.7 ? 'hard' : f >= 0.4 ? 'medium' : 'easy';
}

/** Raw accuracy is nudged by the level of the second section: the same raw score on a harder section means more. */
const LEVEL_SHIFT: Record<Level, number> = { easy: -0.07, medium: 0, hard: 0.07 };

export interface Estimate { low: number; mid: number; high: number }

/** Rough 130–170 estimate. */
export function estimateScore(s1: number, n1: number, s2: number, n2: number, level: Level): Estimate {
  const f = (s1 + s2) / (n1 + n2) + LEVEL_SHIFT[level];
  const mid = Math.round(130 + 40 * Math.min(1, Math.max(0, f)));
  return { low: Math.max(130, mid - 3), mid, high: Math.min(170, mid + 3) };
}

/* ── Stored results (localStorage) ────────────────────────────────────── */

export const MOCKS_KEY = 'sar-mocks-v1';

export interface PartResult { correct: number; total: number; level?: Level; ts: number }
export type MockRecord = Partial<Record<`${Section}${1 | 2}`, PartResult>> & { byChapter?: Record<string, { c: number; n: number }> };
export type MockStore = Record<string, MockRecord>;

export const NO_MOCKS: MockStore = {};
export const parseMocks = (raw: string | null): MockStore => {
  if (!raw) return NO_MOCKS;
  try { return JSON.parse(raw) as MockStore; } catch { return NO_MOCKS; }
};

export function sectionEstimate(r: MockRecord | undefined, section: Section): Estimate | null {
  const a = r?.[`${section}1`], b = r?.[`${section}2`];
  if (!a || !b) return null;
  return estimateScore(a.correct, a.total, b.correct, b.total, b.level ?? 'medium');
}

/* ── Diagnostic: one question from each core chapter ──────────────────── */

export function buildDiagnostic(index: QIndexItem[]): { verbal: string[]; quant: string[] } {
  const rng = new Rng(hashSeed('diagnostic'));
  const pickFrom = (section: Section, chapters: string[], per: number) =>
    chapters.flatMap((ch) =>
      shuffled(index.filter((q) => q.section === section && q.chapter === ch && q.difficulty >= 2 && q.difficulty <= 4 && q.type !== 'RC' && q.type !== 'DI'), rng).slice(0, per).map((q) => q.id));
  const rc = shuffled(index.filter((q) => q.type === 'RC' && q.chapter === 'v3' && q.passageId), rng);
  const firstPassage = rc[0]?.passageId;
  const rcIds = rc.filter((q) => q.passageId === firstPassage).slice(0, 3).map((q) => q.id);
  return {
    verbal: [...pickFrom('verbal', ['v1', 'v2'], 3), ...rcIds],
    quant: pickFrom('quant', ['q1', 'q2', 'q3', 'q4'], 3),
  };
}

export function recordMockPart(kind: string, section: Section | 'diag', part: 1 | 2, result: PartResult, byChapter?: Record<string, { c: number; n: number }>): void {
  try {
    const store = parseMocks(localStorage.getItem(MOCKS_KEY));
    const rec: MockRecord = { ...(store[kind] ?? {}) };
    if (section === 'diag') rec.byChapter = byChapter;
    else rec[`${section}${part}`] = result;
    localStorage.setItem(MOCKS_KEY, JSON.stringify({ ...store, [kind]: rec }));
    window.dispatchEvent(new Event('gre-prep:storage'));
  } catch { /* storage blocked: the test still ran, it just isn't remembered */ }
}
