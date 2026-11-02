/* Full-length practice tests.
 *
 * The content mirrors the book's own tests: two writing tasks, two verbal
 * sections and two quantitative sections of 25 questions each. It is split
 * in two on purpose — what the browser may see (`ExamContent`) and what only
 * the server may see (answers, explanations, score tables) — so the key never
 * travels with the questions.
 *
 * Verbal items are real text. Quantitative items are images cropped from the
 * book (its math and figures are vector drawings with no text layer); the
 * answer controls around them are the app's own.
 */

export interface Img {
  src: string;
  w: number;
  h: number;
}

export interface TextChoice {
  /** Stable letter: 'A', 'B', … continuing across blanks for Text Completion. */
  id: string;
  text: string;
}

/* ── Verbal ───────────────────────────────────────────────────────────── */

export interface TCItem {
  n: number;
  type: 'TC';
  /** Sentence(s) with {{1}}, {{2}}, {{3}} where the blanks go. */
  text: string;
  blanks: { index: number; choices: TextChoice[] }[];
}

export interface SEItem {
  n: number;
  type: 'SE';
  text: string;
  choices: TextChoice[];
}

export interface RCItem {
  n: number;
  type: 'RC';
  passageId: string;
  stem: string;
  /** `sentence`: click the sentence of the passage that answers. */
  format: 'single' | 'multi' | 'sentence';
  choices?: TextChoice[];
}

export type VerbalItem = TCItem | SEItem | RCItem;

export interface Passage {
  id: string;
  /** Marked-up text: **bold**, *italic*, ⟦5⟧ margin line numbers. */
  paragraphs: string[];
  /** The same text cut into sentences, numbered in reading order. */
  sentences: string[][];
}

/* ── Quantitative ─────────────────────────────────────────────────────── */

/** A table printed in the page, typed rather than pictured. Cells may hold $math$. */
export interface SimpleTable {
  head: string[];
  rows: string[][];
}

/** A figure shared by several questions: a picture, a table, or both. */
export interface Exhibit {
  img?: Img;
  title?: string;
  table?: SimpleTable;
}

export interface QuantItem {
  n: number;
  type: 'QC' | 'PS' | 'NE';
  /** `fraction`: numeric entry with a numerator box and a denominator box. */
  format: 'single' | 'multi' | 'numeric' | 'fraction';
  /** A premise shown above the question (QC), or a displayed line such as a list. */
  common?: string;
  /** Quantity A and Quantity B (QC). */
  a?: string;
  b?: string;
  stem?: string;
  /** Text printed before the answer box ("m ="). */
  label?: string;
  /** Printed after the answer box (students, seconds, …). */
  unit?: string;
  table?: SimpleTable;
  /** The geometric figure or graph of this question, cropped from the book. */
  figure?: Img;
  choices?: TextChoice[];
  /** Key into the section's `exhibits`. */
  exhibit?: string;
}

/* ── Sections ─────────────────────────────────────────────────────────── */

interface SectionBase {
  id: string;
  number: number;
  title: string;
  minutes: number;
  directions: string;
}

export interface WritingSection extends SectionBase {
  kind: 'issue' | 'argument';
  prompt: { topic: string[]; task: string };
}

export interface VerbalSection extends SectionBase {
  kind: 'verbal';
  passages: Passage[];
  items: VerbalItem[];
}

export interface QuantSection extends SectionBase {
  kind: 'quant';
  exhibits: Record<string, Exhibit>;
  items: QuantItem[];
}

export type ExamSection = WritingSection | VerbalSection | QuantSection;

// `kind` is a union inside WritingSection, which TypeScript will not narrow
// on directly, hence explicit guards.
export const isWriting = (s: ExamSection): s is WritingSection => s.kind === 'issue' || s.kind === 'argument';
export const hasItems = (s: ExamSection): s is VerbalSection | QuantSection =>
  s.kind === 'verbal' || s.kind === 'quant';

export interface ExamContent {
  id: string;
  number: number;
  title: string;
  source: string;
  sections: ExamSection[];
}

export interface ExamMeta {
  id: string;
  number: number;
  title: string;
  sections: { id: string; kind: ExamSection['kind']; title: string; minutes: number; questions: number }[];
}

/* ── What a test taker produces ───────────────────────────────────────── */

export interface Answer {
  /** Chosen choice ids (SE, RC, QC, PS). */
  ids?: string[];
  /** One id per blank (TC). */
  blanks?: (string | null)[];
  /** 1-based sentence number (RC select-in-passage). */
  sentence?: number | null;
  /** Numeric entry. */
  text?: string;
  num?: string;
  den?: string;
}

export interface SectionResponses {
  answers: Record<number, Answer>;
  essay?: string;
  /** Milliseconds spent on each question. */
  timeMs?: Record<number, number>;
}

export type ExamResponses = Record<string, SectionResponses>;

/* ── Results (built on the server, after the test) ────────────────────── */

export type Expected =
  | { kind: 'ids'; ids: string[] }
  | { kind: 'blanks'; ids: string[] }
  | { kind: 'sentence'; n: number }
  | { kind: 'value'; value: number }
  | { kind: 'fraction'; num: number; den: number };

export interface ItemResult {
  n: number;
  correct: boolean;
  skipped: boolean;
  expected: Expected;
  /** Share of real test takers who got this question right. */
  p: number;
  /** Verbal: paragraphs. Quantitative: an image. */
  explanation: string[] | Img | null;
  timeMs?: number;
}

export interface SampleEssay {
  score: number;
  response: string[];
  commentary: string[];
}

export interface SectionResult {
  id: string;
  kind: ExamSection['kind'];
  correct?: number;
  total?: number;
  items?: ItemResult[];
  essay?: { text: string; words: number };
  samples?: SampleEssay[];
}

export interface ExamResult {
  examId: string;
  completedAt: string;
  verbal: { raw: number; total: number; scaled: number };
  quant: { raw: number; total: number; scaled: number };
  sections: Record<string, SectionResult>;
}

export interface ExamHistoryEntry {
  id: string;
  examId: string;
  completedAt: string;
  verbal: number;
  quant: number;
}
