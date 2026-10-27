/* Content schemas — the contract between authors (people and agents) and the app.
 *
 * Everything under content/ is validated against these at `npm run content:check`
 * and in tests. The lesson schema *is* the lesson template (PLAN §3.2): a lesson
 * cannot exist without a source, a rule within the word budget, a worked
 * example, a trap, and check-yourself questions.
 *
 * Rich text fields use a tiny Markdown subset (**bold**, *italic*, lists) and
 * KaTeX between single dollar signs: $x^2 + 1$.
 */

import { z } from 'zod';

/* ── Sources & syllabus ───────────────────────────────────────────────── */

export const SourceSchema = z.object({
  id: z.string().regex(/^ets-[a-z0-9-]+$/),
  title: z.string().min(3),
  url: z.string().url(),
  kind: z.enum(['pdf', 'web']),
});
export type Source = z.infer<typeof SourceSchema>;

export const OfficialRefSchema = z.object({
  source: z.string(),
  /** Section number or heading inside the source, e.g. "1.1" or "Text Completion — Tips for answering". */
  section: z.string().min(1),
  label: z.string().min(1),
});
export type OfficialRef = z.infer<typeof OfficialRefSchema>;

export const TrackSchema = z.enum(['quant', 'verbal', 'writing', 'test']);
export type Track = z.infer<typeof TrackSchema>;

export const ChapterSchema = z.object({
  id: z.string().regex(/^[qvwt]\d$/),
  track: TrackSchema,
  title: z.string(),
  order: z.number().int().positive(),
  summary: z.string(),
  /** True for study aids that are not an official syllabus topic (vocabulary). */
  supporting: z.boolean().default(false),
});
export type Chapter = z.infer<typeof ChapterSchema>;

export const SyllabusLessonSchema = z.object({
  id: z.string().regex(/^[qvwt]\d-\d{2}-[a-z0-9-]+$/),
  chapter: z.string(),
  title: z.string(),
  order: z.number().int().positive(),
  officialRef: OfficialRefSchema,
  objectives: z.array(z.string()).min(1),
  estMinutes: z.number().int().positive(),
});
export type SyllabusLesson = z.infer<typeof SyllabusLessonSchema>;

export const SyllabusSchema = z.object({
  chapters: z.array(ChapterSchema),
  lessons: z.array(SyllabusLessonSchema),
});

/* ── Questions ────────────────────────────────────────────────────────── */

const Choice = z.object({ id: z.string(), text: z.string().min(1) });
const Difficulty = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

export const ReviewSchema = z.object({
  /** draft → verified (solvers agree, sources checked) → published (editor approved). */
  status: z.enum(['draft', 'verified', 'published']),
  solvedBy: z.array(z.string()),
  sourceChecked: z.boolean(),
  approvedBy: z.string().optional(),
});

export const FigureSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.enum(['bar', 'line']),
    title: z.string().optional(),
    data: z.object({
      categories: z.array(z.string()).min(1),
      series: z.array(z.object({ name: z.string(), values: z.array(z.number()) })).min(1),
      xLabel: z.string().optional(),
      yLabel: z.string().optional(),
      unit: z.string().optional(),
    }),
    notes: z.string().optional(),
  }),
  z.object({
    kind: z.literal('pie'),
    title: z.string().optional(),
    data: z.object({
      slices: z.array(z.object({ label: z.string(), value: z.number() })).min(2),
      total: z.number().optional(),
      unit: z.string().optional(),
    }),
    notes: z.string().optional(),
  }),
  z.object({
    kind: z.literal('table'),
    title: z.string().optional(),
    data: z.object({
      columns: z.array(z.string()).min(1),
      rows: z.array(z.array(z.union([z.string(), z.number()]))).min(1),
      unit: z.string().optional(),
    }),
    notes: z.string().optional(),
  }),
  z.object({
    kind: z.literal('scatter'),
    title: z.string().optional(),
    data: z.object({
      points: z.array(z.tuple([z.number(), z.number()])).min(2),
      xLabel: z.string().optional(),
      yLabel: z.string().optional(),
    }),
    notes: z.string().optional(),
  }),
  /** Hand-authored SVG for geometry; must be self-contained, viewBox only. */
  z.object({
    kind: z.literal('svg'),
    title: z.string().optional(),
    data: z.object({ svg: z.string().startsWith('<svg'), alt: z.string().min(5) }),
    notes: z.string().optional(),
  }),
]);
export type FigureSpec = z.infer<typeof FigureSchema>;

const base = {
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  /** Lesson this item practises, or a chapter-level pool id like "q1-test". */
  lessonId: z.string(),
  difficulty: Difficulty,
  stem: z.string().min(1),
  explanation: z.string().min(10),
  /** One line per wrong choice id (or per wrong blank choice id). */
  choiceExplanations: z.record(z.string(), z.string()).optional(),
  estSeconds: z.number().int().min(15).max(300),
  skills: z.array(z.string()).default([]),
  /** Ids from content/topics.json this item exercises (coverage is enforced by content:check). */
  topics: z.array(z.string()).default([]),
  passageId: z.string().optional(),
  figure: FigureSchema.optional(),
  review: ReviewSchema,
};

const TC = z.object({
  ...base,
  type: z.literal('TC'),
  content: z.object({
    text: z.string(),
    blanks: z.array(z.object({ index: z.number().int().min(1).max(3), choices: z.array(Choice) })).min(1).max(3),
  }),
  answer: z.object({ blanks: z.array(z.string()) }),
});
const SE = z.object({
  ...base,
  type: z.literal('SE'),
  content: z.object({ text: z.string(), choices: z.array(Choice) }),
  answer: z.object({ choices: z.tuple([z.string(), z.string()]) }),
});
const RC = z.object({
  ...base,
  type: z.literal('RC'),
  passageId: z.string(),
  content: z.object({
    format: z.enum(['select_one', 'select_all', 'select_in_passage']),
    choices: z.array(Choice).optional(),
    paragraphIndex: z.number().int().min(0).optional(),
  }),
  answer: z.union([z.object({ choices: z.array(z.string()).min(1) }), z.object({ sentence: z.string().min(5) })]),
});
const QC = z.object({
  ...base,
  type: z.literal('QC'),
  content: z.object({ quantityA: z.string(), quantityB: z.string(), common: z.string().optional() }),
  answer: z.object({ choice: z.enum(['A', 'B', 'C', 'D']) }),
});
const PS = z.object({
  ...base,
  type: z.literal('PS'),
  content: z.object({ format: z.enum(['select_one', 'select_all']), choices: z.array(Choice) }),
  answer: z.object({ choices: z.array(z.string()).min(1) }),
});
const NE = z.object({
  ...base,
  type: z.literal('NE'),
  content: z.object({
    format: z.enum(['integer', 'decimal', 'fraction']),
    unit: z.string().optional(),
    round: z.number().int().optional(),
  }),
  answer: z.object({
    value: z.number(),
    tolerance: z.number().optional(),
    fraction: z.object({ numerator: z.number().int(), denominator: z.number().int() }).optional(),
  }),
});
const DI = z.object({
  ...base,
  type: z.literal('DI'),
  figure: FigureSchema,
  content: z.object({
    format: z.enum(['select_one', 'select_all', 'numeric_entry']),
    choices: z.array(Choice).optional(),
    numeric: z.object({ format: z.enum(['integer', 'decimal', 'fraction']), unit: z.string().optional(), round: z.number().int().optional() }).optional(),
  }),
  answer: z.union([
    z.object({ choices: z.array(z.string()).min(1) }),
    z.object({ value: z.number(), tolerance: z.number().optional(), fraction: z.object({ numerator: z.number().int(), denominator: z.number().int() }).optional() }),
  ]),
});

export const QuestionSchema = z.discriminatedUnion('type', [TC, SE, RC, QC, PS, NE, DI]);
export type ContentQuestionInput = z.infer<typeof QuestionSchema>;

/* ── Passages ─────────────────────────────────────────────────────────── */

export const PassageSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  title: z.string().optional(),
  field: z.enum(['physical-sciences', 'biological-sciences', 'social-sciences', 'business', 'arts-humanities', 'everyday']),
  /** One string per paragraph. */
  paragraphs: z.array(z.string().min(20)).min(1).max(5),
  difficulty: Difficulty,
});
export type PassageSpec = z.infer<typeof PassageSchema>;

/* ── Lessons (the template) ───────────────────────────────────────────── */

export const RULE_WORD_BUDGET = 120;

export const LessonSchema = z.object({
  id: z.string().regex(/^[qvwt]\d-\d{2}-[a-z0-9-]+$/),
  status: z.enum(['draft', 'published']),
  /** Why it matters: one sentence on where this appears on the GRE. */
  why: z.string().min(10).max(260),
  /** The explanation, as short as understanding allows. ≤ RULE_WORD_BUDGET words unless justified. */
  rule: z.string().min(20),
  lengthJustification: z.string().optional(),
  examples: z
    .array(
      z.object({
        prompt: z.string(),
        steps: z.array(z.string()).min(1),
        answer: z.string(),
      }),
    )
    .min(1)
    .max(3),
  /** The classic trap, 1–3 lines. */
  trap: z.string().min(10).max(420),
  /** 2–3 inline micro-questions with immediate feedback. */
  checks: z.array(QuestionSchema).min(2).max(3),
});
export type LessonContent = z.infer<typeof LessonSchema>;

/** Words in a rich-text string, ignoring $math$ segments and markdown marks. */
export function wordCount(rich: string): number {
  return rich
    .replace(/\$[^$]*\$/g, ' ')
    .split(/\s+/)
    .filter((t) => /[\p{L}\p{N}]/u.test(t)).length;
}

/** Master checklist of concepts, techniques and traps; each needs at least one published question. */
export const TopicSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9.-]*$/),
  group: z.string(),
  title: z.string().min(3),
  /** Lesson that teaches it (an id in syllabus.json). */
  lessonId: z.string(),
  kind: z.enum(['concept', 'technique', 'trap', 'pattern']),
});
export const TopicsFileSchema = z.object({ topics: z.array(TopicSchema) });
export type Topic = z.infer<typeof TopicSchema>;
