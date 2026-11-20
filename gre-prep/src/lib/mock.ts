/* Mock tests, the diagnostic, and the exact defined mock score table.
 *
 * Mirrors the real structure: Verbal 12 + 15, Quant 12 + 15. The first
 * section of each measure is of average difficulty (levels 2–4); the second
 * section always routes to the Hard module (levels 4–5) so every mock trains
 * against top-tier difficulty and uses the exact 0–27 -> 130–170 scale.
 * Everything is deterministic from the mock number so a mock can be resumed
 * or re-opened and always shows the same questions. */

import { Rng, hashSeed } from './generators/rng';
import { mockScaledScore, type GreScoreEstimate } from './gre-score';
import type { SavedRunItem } from './run-history';
import type { QIndexItem } from '@/content/qindex';

export type Section = 'verbal' | 'quant';
export type Level = 'easy' | 'medium' | 'hard';

export const MOCK_COUNT = 6;
export const SECTION_SIZE = { 1: 12, 2: 15 } as const;
/** Section 2 always uses the hard module (difficulty 4–5). */
export const MOCK_SECTION2_LEVEL: Level = 'hard';
/** Minutes allotted by ETS for each section part. */
export const SECTION_MINUTES: Record<Section, { 1: number; 2: number }> = { verbal: { 1: 18, 2: 23 }, quant: { 1: 21, 2: 26 } };

const BAND: Record<Level | 'avg', [number, number]> = { easy: [1, 3], medium: [2, 4], hard: [4, 5], avg: [2, 4] };

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
  // Top up from the band, then >= 3 (for hard section 2), then the whole section, if a type ran short.
  const pools = part === 2 && level === 'hard'
    ? [inBand, base.filter((q) => q.difficulty >= 3), base]
    : [inBand, base];
  for (const pool of pools) {
    for (const q of shuffled(pool, rng)) {
      if (ids.length >= size) break;
      if (!taken.has(q.id)) { ids.push(q.id); taken.add(q.id); }
    }
  }
  return ids.slice(0, size);
}

export const mockSeed = (kind: string) => `mock:${kind}`;

/** Reference adaptive thresholds on the real GRE (0.7+ -> hard, 0.4+ -> medium). */
export function adaptiveLevelFor(correct: number, total: number): Level {
  const f = total ? correct / total : 0;
  return f >= 0.7 ? 'hard' : f >= 0.4 ? 'medium' : 'easy';
}

/** In this app, section 2 always routes to the Hard module (difficulty 4–5). */
export function levelFor(_correct?: number, _total?: number): Level {
  void _correct;
  void _total;
  return MOCK_SECTION2_LEVEL;
}

export interface Estimate {
  scaled: number;
  low: number;
  mid: number;
  high: number;
  percentile: number;
  raw: number;
  total: number;
}

/** Exact defined 130–170 score & ETS percentile for a mock measure. */
export function estimateScore(
  s1: number,
  n1: number,
  s2: number,
  n2: number,
  level: Level = MOCK_SECTION2_LEVEL,
  section: Section = 'quant',
): Estimate {
  const raw = s1 + s2;
  const total = n1 + n2;
  const res = mockScaledScore(section, raw, total, level);
  return { ...res, raw, total };
}

/* ── Stored results (localStorage) ────────────────────────────────────── */

export const MOCKS_KEY = 'sar-mocks-v1';

export interface PartResult {
  correct: number;
  total: number;
  level?: Level;
  ts: number;
  items?: SavedRunItem[];
}
export type MockRecord = Partial<Record<`${Section}${1 | 2}`, PartResult>> & {
  byChapter?: Record<string, { c: number; n: number }>;
  diagScore?: { verbal: GreScoreEstimate | null; quant: GreScoreEstimate | null };
};
export type MockStore = Record<string, MockRecord>;

export const NO_MOCKS: MockStore = {};
export const parseMocks = (raw: string | null): MockStore => {
  if (!raw) return NO_MOCKS;
  try { return JSON.parse(raw) as MockStore; } catch { return NO_MOCKS; }
};

export function sectionEstimate(r: MockRecord | undefined, section: Section): Estimate | null {
  const a = r?.[`${section}1`], b = r?.[`${section}2`];
  if (!a || !b) return null;
  return estimateScore(a.correct, a.total, b.correct, b.total, b.level ?? MOCK_SECTION2_LEVEL, section);
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

export function recordMockPart(
  kind: string,
  section: Section | 'diag',
  part: 1 | 2,
  result: PartResult,
  byChapter?: Record<string, { c: number; n: number }>,
  diagScore?: { verbal: GreScoreEstimate | null; quant: GreScoreEstimate | null },
): void {
  try {
    const store = parseMocks(localStorage.getItem(MOCKS_KEY));
    const rec: MockRecord = { ...(store[kind] ?? {}) };
    if (section === 'diag') {
      rec.byChapter = byChapter;
      if (diagScore) rec.diagScore = diagScore;
    } else {
      rec[`${section}${part}`] = result;
    }
    localStorage.setItem(MOCKS_KEY, JSON.stringify({ ...store, [kind]: rec }));
    window.dispatchEvent(new Event('gre-prep:storage'));
  } catch { /* storage blocked: the test still ran, it just isn't remembered */ }
}
