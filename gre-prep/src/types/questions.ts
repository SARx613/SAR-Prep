/* ── GRE question model ───────────────────────────────────────────────────
 * Calibrated on the ETS published specifications for the shorter General
 * Test (in force since 22 Sep 2023). Every item in the bank is original
 * content written against these specs — the specs describe the exam's
 * format and the skills it measures, which is what we generate against.
 *
 *   Verbal   TC  Text Completion      1–3 blanks; 5 choices if one blank,
 *                                     3 per blank otherwise; no partial credit
 *            SE  Sentence Equivalence 1 blank, 6 choices, pick exactly 2,
 *                                     both sentences must mean the same thing
 *            RC  Reading Comprehension against a passage; select-one,
 *                                     select-all, or select-in-passage
 *   Quant    QC  Quantitative Comparison  four fixed choices, always in the
 *                                         same order
 *            PS  Problem Solving      select-one (5 choices) or select-all
 *            NE  Numeric Entry        typed integer/decimal, or fraction
 *            DI  Data Interpretation  attached to a figure; any quant format
 */

export type Section = 'verbal' | 'quant';
export type QuestionType = 'TC' | 'SE' | 'RC' | 'QC' | 'PS' | 'NE' | 'DI';

/** 1 = easiest … 5 = hardest. ETS scales adaptively; we bucket. */
export type Difficulty = 1 | 2 | 3 | 4 | 5;

export interface Choice {
  /** Stable within a question: 'A', 'B', … or per-blank '1A', '1B', … */
  id: string;
  text: string;
}

/* ── Per-type content shapes (the `content` JSONB column) ─────────────── */

export interface TCBlank {
  /** 1-indexed position, matching the {{1}} markers in the stem. */
  index: number;
  choices: Choice[];
}

export interface TCContent {
  /** Sentence(s) with blanks marked as {{1}}, {{2}}, {{3}}. */
  text: string;
  blanks: TCBlank[];
}

export interface SEContent {
  /** Single sentence with exactly one {{1}} marker. */
  text: string;
  choices: Choice[];
}

export type RCFormat = 'select_one' | 'select_all' | 'select_in_passage';

export interface RCContent {
  format: RCFormat;
  /** Absent when format is 'select_in_passage'. */
  choices?: Choice[];
  /** For 'select_in_passage': which paragraph to restrict the pick to. */
  paragraphIndex?: number;
}

export interface QCContent {
  quantityA: string;
  quantityB: string;
  /** Shared premises shown above both quantities. */
  common?: string;
}

export interface PSContent {
  format: 'select_one' | 'select_all';
  choices: Choice[];
}

export interface NEContent {
  /** 'fraction' renders two boxes (numerator / denominator). */
  format: 'integer' | 'decimal' | 'fraction';
  unit?: string;
  /** Decimal places to round to, when the item asks for rounding. */
  round?: number;
}

export interface DIContent {
  /** DI reuses the quant formats, over the attached figure. */
  format: 'select_one' | 'select_all' | 'numeric_entry';
  choices?: Choice[];
  numeric?: NEContent;
}

export type QuestionContent =
  | TCContent
  | SEContent
  | RCContent
  | QCContent
  | PSContent
  | NEContent
  | DIContent;

/* ── Per-type answer shapes (the `answer` JSONB column) ───────────────── */

/** One choice id per blank, ordered by blank index. No partial credit. */
export interface TCAnswer {
  blanks: string[];
}

/** Exactly two choice ids. No partial credit. */
export interface SEAnswer {
  choices: [string, string];
}

export interface ChoiceAnswer {
  choices: string[];
}

export interface InPassageAnswer {
  /** The exact sentence the reader must click. */
  sentence: string;
}

/** The four QC choices are fixed and always in this order. */
export const QC_CHOICES: readonly Choice[] = [
  { id: 'A', text: 'Quantity A is greater.' },
  { id: 'B', text: 'Quantity B is greater.' },
  { id: 'C', text: 'The two quantities are equal.' },
  {
    id: 'D',
    text: 'The relationship cannot be determined from the information given.',
  },
] as const;

export interface QCAnswer {
  choice: 'A' | 'B' | 'C' | 'D';
}

export interface NEAnswer {
  /** Canonical value. For fractions, the reduced decimal equivalent. */
  value: number;
  /** Accepts any entry within this absolute tolerance. */
  tolerance?: number;
  /** Set when the item is answered as a fraction. */
  fraction?: { numerator: number; denominator: number };
}

export type QuestionAnswer =
  | TCAnswer
  | SEAnswer
  | ChoiceAnswer
  | InPassageAnswer
  | QCAnswer
  | NEAnswer;

/* ── Figures (the `figures.data` JSONB column) ────────────────────────── */

export type FigureKind = 'bar' | 'line' | 'pie' | 'table' | 'scatter';

export interface SeriesFigureData {
  categories: string[];
  series: { name: string; values: number[] }[];
  xLabel?: string;
  yLabel?: string;
  unit?: string;
}

export interface PieFigureData {
  slices: { label: string; value: number }[];
  /** Absolute total, when the slices are percentages of a stated whole. */
  total?: number;
  unit?: string;
}

export interface TableFigureData {
  columns: string[];
  rows: (string | number)[][];
  unit?: string;
}

export type FigureData = SeriesFigureData | PieFigureData | TableFigureData;

/* ── Rows ─────────────────────────────────────────────────────────────── */

export interface Question {
  id: string;
  type: QuestionType;
  section: Section;
  topic: string;
  subtopic: string | null;
  difficulty: Difficulty;
  passageId: string | null;
  figureId: string | null;
  /** The prompt. For TC/SE the sentence lives in `content.text` instead. */
  stem: string;
  content: QuestionContent;
  answer: QuestionAnswer;
  explanation: string | null;
  source: string | null;
  tags: string[];
}

export interface Passage {
  id: string;
  title: string | null;
  body: string;
  wordCount: number | null;
  topic: string | null;
  difficulty: Difficulty | null;
  source: string | null;
}

export interface Figure {
  id: string;
  kind: FigureKind;
  title: string | null;
  data: FigureData;
  notes: string | null;
}

/* ── Narrowing helpers ────────────────────────────────────────────────── */

export const isVerbal = (t: QuestionType): boolean =>
  t === 'TC' || t === 'SE' || t === 'RC';

export function sectionOf(t: QuestionType): Section {
  return isVerbal(t) ? 'verbal' : 'quant';
}
