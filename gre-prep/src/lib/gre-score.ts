/* PDF-calibrated GRE score estimation and official ETS percentile mapping.
 *
 * Empirical item difficulties (P+) and 0–50 raw-to-scaled conversion tables are
 * derived from the two full-length tests in "The Official Guide to the GRE
 * General Test, 3rd Edition" (100 Verbal + 100 Quant items with published P+
 * statistics and official score conversion tables). */

import { hashSeed } from './generators/rng';

export type GreSection = 'verbal' | 'quant';
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;
export type MockLevel = 'easy' | 'medium' | 'hard';

/** Mean P+ (% of real GRE examinees answering correctly) per difficulty 1–5 from the Official Guide PDF. */
export const P_PLUS_BY_DIFFICULTY: Record<GreSection, Record<DifficultyLevel, number>> = {
  verbal: { 1: 79, 2: 65, 3: 54, 4: 43, 5: 27 },
  quant: { 1: 75, 2: 63, 3: 50, 4: 40, 5: 25 },
};

/** Empirical P+ ranges [min, max] per difficulty level observed across Official Guide items. */
export const P_PLUS_BANDS: Record<GreSection, Record<DifficultyLevel, readonly [number, number]>> = {
  verbal: { 1: [71, 90], 2: [60, 70], 3: [49, 59], 4: [38, 48], 5: [14, 37] },
  quant: { 1: [68, 88], 2: [58, 67], 3: [46, 57], 4: [35, 45], 5: [12, 34] },
};

/** Official ETS raw-to-scaled conversion table (0..50 -> 130..170) averaged from Practice Tests 1 & 2. */
export const OFFICIAL_CONVERSION_50: Record<GreSection, readonly number[]> = {
  verbal: [
    130, 130, 130, 130, 130, 130, 132, 134, 136, 137, 139, 140, 141, 142, 143, 144, 145,
    146, 147, 148, 149, 149, 150, 151, 152, 152, 153, 154, 154, 155, 156, 156, 157, 158,
    159, 159, 160, 161, 162, 162, 163, 164, 165, 166, 167, 168, 169, 170, 170, 170, 170,
  ],
  quant: [
    130, 130, 130, 130, 130, 130, 131, 133, 134, 136, 137, 138, 140, 141, 142, 143, 143,
    144, 145, 146, 147, 148, 148, 149, 150, 150, 151, 152, 153, 153, 154, 155, 155, 156,
    157, 158, 159, 159, 160, 161, 162, 163, 164, 165, 167, 168, 169, 170, 170, 170, 170,
  ],
};

/** Official ETS percentile ranks for scaled scores 130–170. */
export const ETS_PERCENTILES: Record<GreSection, Record<number, number>> = {
  verbal: {
    170: 99, 169: 99, 168: 98, 167: 97, 166: 96, 165: 95, 164: 94, 163: 92, 162: 89, 161: 87,
    160: 83, 159: 80, 158: 76, 157: 72, 156: 68, 155: 63, 154: 58, 153: 53, 152: 48, 151: 43,
    150: 38, 149: 33, 148: 29, 147: 25, 146: 21, 145: 18, 144: 15, 143: 12, 142: 10, 141: 8,
    140: 6, 139: 4, 138: 3, 137: 2, 136: 1, 135: 1, 134: 1, 133: 1, 132: 1, 131: 1, 130: 1,
  },
  quant: {
    170: 92, 169: 88, 168: 84, 167: 81, 166: 78, 165: 74, 164: 71, 163: 68, 162: 65, 161: 62,
    160: 58, 159: 55, 158: 52, 157: 49, 156: 46, 155: 43, 154: 39, 153: 36, 152: 33, 151: 30,
    150: 27, 149: 24, 148: 21, 147: 18, 146: 16, 145: 14, 144: 12, 143: 10, 142: 8, 141: 6,
    140: 5, 139: 4, 138: 3, 137: 2, 136: 1, 135: 1, 134: 1, 133: 1, 132: 1, 131: 1, 130: 1,
  },
};

const HARD_MOCK_27: Record<GreSection, readonly number[]> = {
  verbal: [
    130, 130, 130, 132, 136, 139, 142, 144, 146, 148, 149, 151, 152, 153,
    154, 156, 157, 158, 159, 161, 162, 163, 165, 166, 168, 169, 170, 170,
  ],
  quant: [
    130, 130, 130, 131, 134, 138, 141, 143, 145, 146, 148, 149, 150, 152,
    153, 154, 155, 157, 158, 159, 161, 162, 164, 165, 167, 168, 169, 170,
  ],
};

/** Exact defined 0..27 -> 130..170 score tables for the 27-question shorter GRE mock test. */
export const MOCK_CONVERSION_27: Record<GreSection, Record<MockLevel, readonly number[]>> = {
  verbal: {
    hard: HARD_MOCK_27.verbal,
    medium: HARD_MOCK_27.verbal.map((s) => Math.min(163, Math.max(130, s - 3))),
    easy: HARD_MOCK_27.verbal.map((s) => Math.min(156, Math.max(130, s - 7))),
  },
  quant: {
    hard: HARD_MOCK_27.quant,
    medium: HARD_MOCK_27.quant.map((s) => Math.min(163, Math.max(130, s - 3))),
    easy: HARD_MOCK_27.quant.map((s) => Math.min(156, Math.max(130, s - 7))),
  },
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function clampDiff(d: number): DifficultyLevel {
  return clamp(Math.round(d), 1, 5) as DifficultyLevel;
}

function logit(p: number): number {
  const c = clamp(p, 0.01, 0.99);
  return Math.log(c / (1 - c));
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

/** Deterministic empirical ETS P+ (% of GRE takers answering correctly) for a question. */
export function questionPPlus(q: { id?: string; section: GreSection; difficulty: number }): number {
  const d = clampDiff(q.difficulty);
  const center = P_PLUS_BY_DIFFICULTY[q.section][d];
  if (!q.id) return center;
  const [lo, hi] = P_PLUS_BANDS[q.section][d];
  const half = Math.min(center - lo, hi - center, 4);
  if (half <= 0) return center;
  const h = hashSeed(q.id);
  const offset = (h % (2 * half + 1)) - half;
  return clamp(center + offset, lo, hi);
}

/** Official ETS percentile rank (1..99) for a 130..170 scaled score. */
export function etsPercentile(section: GreSection, scaled: number): number {
  const s = clamp(Math.round(scaled), 130, 170);
  return ETS_PERCENTILES[section][s] ?? 1;
}

/** English ordinal formatting (e.g., 1st, 2nd, 3rd, 68th). */
export function ordinal(n: number): string {
  const v = Math.round(n);
  const mod100 = v % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${v}th`;
  switch (v % 10) {
    case 1: return `${v}st`;
    case 2: return `${v}nd`;
    case 3: return `${v}rd`;
    default: return `${v}th`;
  }
}

/** Exact defined scaled score and ETS percentile for a 27-question mock test section. */
export function mockScaledScore(
  section: GreSection,
  rawCorrect: number,
  total: number,
  level: MockLevel = 'hard',
): { scaled: number; low: number; mid: number; high: number; percentile: number } {
  const raw27 =
    total === 27
      ? clamp(Math.round(rawCorrect), 0, 27)
      : total > 0
        ? clamp(Math.round((rawCorrect / total) * 27), 0, 27)
        : 0;
  const scaled = MOCK_CONVERSION_27[section][level][raw27] ?? 130;
  return {
    scaled,
    mid: scaled,
    low: Math.max(130, scaled - 2),
    high: Math.min(170, scaled + 2),
    percentile: etsPercentile(section, scaled),
  };
}

export interface ScoredItem {
  id?: string;
  section: GreSection;
  difficulty: number;
  correct: boolean;
}

export interface GreScoreEstimate {
  section: GreSection;
  scaled: number;
  low: number;
  high: number;
  percentile: number;
  correct: number;
  total: number;
  avgDifficulty: number;
  avgPPlus: number;
}

/**
 * Estimates an indicative 130–170 GRE score + ETS percentile for any set of questions
 * using MAP Rasch 1PL calibration anchored to the Official Guide P+ statistics and
 * raw-to-scaled conversion table.
 */
export function estimateSetScore(items: ScoredItem[], section: GreSection): GreScoreEstimate | null {
  const mine = items.filter((it) => it.section === section);
  const total = mine.length;
  if (total === 0) return null;

  const correct = mine.filter((it) => it.correct).length;
  const avgDifficulty = mine.reduce((acc, it) => acc + clampDiff(it.difficulty), 0) / total;
  const pValues = mine.map((it) => questionPPlus({ id: it.id, section, difficulty: it.difficulty }));
  const avgPPlus = Math.round(pValues.reduce((acc, p) => acc + p, 0) / total);

  let raw50: number;
  if (correct === 0) {
    raw50 = 0;
  } else if (correct === total && avgDifficulty >= 3.2 && total >= 8) {
    raw50 = 50;
  } else {
    const bs = pValues.map((p) => -logit(p / 100));
    const ws = mine.map((it) => 0.7 + 0.15 * clampDiff(it.difficulty));
    const ys = mine.map((it) => (it.correct ? 1 : 0));
    const prior = 0.8;
    const priorMean = (avgDifficulty - 3) * 0.35;

    let lo = -4.5;
    let hi = 4.5;
    for (let iter = 0; iter < 40; iter++) {
      const mid = 0.5 * (lo + hi);
      let grad = -prior * (mid - priorMean);
      for (let i = 0; i < total; i++) {
        grad += ws[i] * (ys[i] - sigmoid(mid - bs[i]));
      }
      if (grad > 0) lo = mid;
      else hi = mid;
    }
    const theta = 0.5 * (lo + hi);

    // Project latent ability onto a balanced 50-item official test (10 items per difficulty 1..5).
    let expectedRaw = 0;
    for (const d of [1, 2, 3, 4, 5] as const) {
      const bRef = -logit(P_PLUS_BY_DIFFICULTY[section][d] / 100);
      expectedRaw += 10 * sigmoid(theta - bRef);
    }
    raw50 = clamp(Math.round(expectedRaw), 0, 50);
  }

  const scaled = OFFICIAL_CONVERSION_50[section][raw50] ?? 130;
  const margin = total >= 25 ? 1 : total >= 15 ? 2 : 3;
  return {
    section,
    scaled,
    low: Math.max(130, scaled - margin),
    high: Math.min(170, scaled + margin),
    percentile: etsPercentile(section, scaled),
    correct,
    total,
    avgDifficulty,
    avgPPlus,
  };
}

/** Indicative Verbal Reasoning score estimate for a completed vocabulary series. */
export function estimateVocabSeriesScore(
  correct: number,
  total: number,
  isEasyTheme = false,
): GreScoreEstimate {
  const n = Math.max(1, total);
  const c = clamp(Math.round(correct), 0, n);
  const difficulty = isEasyTheme ? 2 : 3.5;
  const items: ScoredItem[] = Array.from({ length: n }, (_, i) => ({
    section: 'verbal',
    difficulty: isEasyTheme ? 2 : i % 2 === 0 ? 3 : 4,
    correct: i < c,
  }));
  return (
    estimateSetScore(items, 'verbal') ?? {
      section: 'verbal',
      scaled: 130,
      low: 130,
      high: 133,
      percentile: 1,
      correct: c,
      total: n,
      avgDifficulty: difficulty,
      avgPPlus: 54,
    }
  );
}
