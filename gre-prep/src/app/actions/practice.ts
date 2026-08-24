'use server';

import { and, eq, inArray, sql } from 'drizzle-orm';
import { db } from '@/db';
import { attempts, figures, passages, questions } from '@/db/schema';
import { auth } from '@/auth';
import { grade, type Response } from '@/lib/grading';
import type { Figure, Passage, Question, Section } from '@/types/questions';

/**
 * Practice-session data access.
 *
 * As with progress, isolation lives here: the user id always comes from the
 * session and is never accepted from the caller. Answer keys are a second
 * concern — `getQuiz` strips them, so a reader of the network response
 * cannot see the answers before submitting.
 */

/** A question as sent to the client: no `answer` field. */
export type ClientQuestion = Omit<Question, 'answer' | 'explanation'>;

export interface Quiz {
  questions: ClientQuestion[];
  passages: Passage[];
  figures: Figure[];
}

export interface QuizFilters {
  section?: Section;
  types?: string[];
  topics?: string[];
  /** Verbal taxonomy: tc-1-blank, sentence-equivalence, inference, … */
  subtopics?: string[];
  difficulties?: number[];
  count?: number;
}

export async function getQuiz(filters: QuizFilters = {}): Promise<Quiz> {
  const count = Math.min(filters.count ?? 10, 40);

  const conditions = [];
  if (filters.section) conditions.push(eq(questions.section, filters.section));
  if (filters.types?.length) conditions.push(inArray(questions.type, filters.types));
  if (filters.topics?.length) conditions.push(inArray(questions.topic, filters.topics));
  if (filters.subtopics?.length)
    conditions.push(inArray(questions.subtopic, filters.subtopics));
  if (filters.difficulties?.length)
    conditions.push(inArray(questions.difficulty, filters.difficulties));

  const rows = await db
    .select()
    .from(questions)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(sql`random()`)
    .limit(count);

  // Pull the passages and figures those questions depend on.
  const passageIds = [...new Set(rows.map((r) => r.passageId).filter(Boolean))] as string[];
  const figureIds = [...new Set(rows.map((r) => r.figureId).filter(Boolean))] as string[];

  const [passageRows, figureRows] = await Promise.all([
    passageIds.length
      ? db.select().from(passages).where(inArray(passages.id, passageIds))
      : Promise.resolve([]),
    figureIds.length
      ? db.select().from(figures).where(inArray(figures.id, figureIds))
      : Promise.resolve([]),
  ]);

  return {
    // Strip the key and the explanation: both are revealed only after the
    // user has answered, via `submitAnswer`.
    questions: rows.map((r) => ({
      id: r.id,
      type: r.type,
      section: r.section,
      topic: r.topic,
      subtopic: r.subtopic,
      difficulty: r.difficulty,
      passageId: r.passageId,
      figureId: r.figureId,
      stem: r.stem,
      content: r.content,
      tags: r.tags,
      source: r.source,
    })) as ClientQuestion[],
    passages: passageRows as Passage[],
    figures: figureRows as Figure[],
  };
}

export interface SubmitResult {
  isCorrect: boolean;
  expected: string[];
  explanation: string | null;
}

/**
 * Grades one answer and records the attempt.
 *
 * Grading happens here rather than on the client because the client never
 * receives the key. The attempt row is append-only, so re-answering the
 * same question adds history instead of overwriting it.
 */
export async function submitAnswer(
  questionId: string,
  response: Response,
  meta: { sessionId?: string; timeSpentMs?: number; flagged?: boolean } = {}
): Promise<SubmitResult> {
  const [row] = await db
    .select()
    .from(questions)
    .where(eq(questions.id, questionId))
    .limit(1);

  if (!row) throw new Error('Question not found');

  const result = grade(row as unknown as Question, response);

  // Signed-out users still get graded — only the attempt history needs an
  // account. A failure to resolve the session must therefore not fail the
  // answer, so it is caught rather than propagated.
  let userId: string | undefined;
  try {
    const session = await auth();
    userId = session?.user?.id;
  } catch {
    userId = undefined;
  }

  if (userId) {
    await db.insert(attempts).values({
      userId,
      questionId,
      sessionId: meta.sessionId ?? null,
      response,
      isCorrect: result.isCorrect,
      timeSpentMs: meta.timeSpentMs ?? null,
      flagged: meta.flagged ?? false,
    });
  }

  return {
    isCorrect: result.isCorrect,
    expected: result.expected,
    explanation: row.explanation,
  };
}

export interface TopicStat {
  topic: string;
  section: string;
  attempted: number;
  correct: number;
}

/** Per-topic accuracy, for showing the user where they are weak. */
export async function getTopicStats(): Promise<TopicStat[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const rows = await db
    .select({
      topic: questions.topic,
      section: questions.section,
      attempted: sql<number>`count(*)::int`,
      correct: sql<number>`count(*) filter (where ${attempts.isCorrect})::int`,
    })
    .from(attempts)
    .innerJoin(questions, eq(attempts.questionId, questions.id))
    .where(eq(attempts.userId, userId))
    .groupBy(questions.topic, questions.section);

  return rows;
}

/** Counts available per section and type, for the quiz setup screen. */
export async function getBankSummary() {
  const rows = await db
    .select({
      section: questions.section,
      type: questions.type,
      n: sql<number>`count(*)::int`,
    })
    .from(questions)
    .groupBy(questions.section, questions.type);
  return rows;
}

/**
 * Counts per verbal subtopic, for the category picker.
 *
 * Returns the taxonomy the bank is organised by — the four short-verbal
 * kinds and the six reading-comprehension categories — so the picker can
 * show real counts and disable categories the bank cannot fill.
 */
export async function getVerbalCategories() {
  const rows = await db
    .select({
      subtopic: questions.subtopic,
      type: questions.type,
      n: sql<number>`count(*)::int`,
    })
    .from(questions)
    .where(eq(questions.section, 'verbal'))
    .groupBy(questions.subtopic, questions.type);

  return rows
    .filter((r): r is typeof r & { subtopic: string } => r.subtopic !== null)
    .map((r) => ({
      subtopic: r.subtopic,
      group: r.type === 'RC' ? ('reading' as const) : ('short' as const),
      n: r.n,
    }));
}

/* ── Progress ─────────────────────────────────────────────────────────────
 * Mirrors the vocabulary dashboard, but for questions.
 *
 * `attempts` is append-only, so a question's CURRENT state is its most
 * recent attempt — not a tally of every pass at it. A question answered
 * wrong in March and right in August counts as mastered, while the attempt
 * history still shows the earlier miss. That distinction is why `mastered`
 * and `review` come from a latest-attempt-per-question subquery, and why
 * accuracy (which does look at the whole history) is reported separately.
 */

export interface ProgressRow {
  section: string;
  type: string;
  topic: string;
  subtopic: string | null;
  /** Questions of this kind in the bank. */
  total: number;
  /** Distinct questions the user has attempted at least once. */
  attempted: number;
  /** Attempted, and correct on the most recent attempt. */
  mastered: number;
  /** Attempted, and wrong on the most recent attempt. */
  review: number;
  /** Every attempt ever, and how many were correct. */
  attempts: number;
  correct: number;
}

export async function getQuestionProgress(): Promise<ProgressRow[]> {
  const session = await auth();
  const userId = session?.user?.id;

  // Signed out: no attempt history exists, but the bank totals still do, so
  // the page can show what is available rather than nothing at all.
  const rows = await db.execute(sql`
    with latest as (
      select distinct on (question_id) question_id, is_correct
      from attempts
      where user_id = ${userId ?? null}
      order by question_id, created_at desc
    ),
    tally as (
      select question_id,
             count(*)::int as n,
             count(*) filter (where is_correct)::int as ok
      from attempts
      where user_id = ${userId ?? null}
      group by question_id
    )
    select
      q.section,
      q.type,
      q.topic,
      q.subtopic,
      count(*)::int                                            as total,
      count(l.question_id)::int                                as attempted,
      count(*) filter (where l.is_correct)::int                as mastered,
      count(*) filter (where l.is_correct = false)::int        as review,
      coalesce(sum(t.n), 0)::int                               as attempts,
      coalesce(sum(t.ok), 0)::int                              as correct
    from questions q
    left join latest l on l.question_id = q.id
    left join tally  t on t.question_id = q.id
    group by q.section, q.type, q.topic, q.subtopic
    order by q.section, q.type, q.topic, q.subtopic
  `);

  return (rows.rows ?? rows) as unknown as ProgressRow[];
}

/** Recent sessions, so the page can show activity over time. */
export interface RecentDay {
  day: string;
  attempts: number;
  correct: number;
}

export async function getRecentActivity(days = 30): Promise<RecentDay[]> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const rows = await db.execute(sql`
    select
      to_char(date_trunc('day', created_at), 'YYYY-MM-DD') as day,
      count(*)::int                             as attempts,
      count(*) filter (where is_correct)::int   as correct
    from attempts
    where user_id = ${userId}
      and created_at >= now() - (${days} || ' days')::interval
    group by 1
    order by 1
  `);

  return (rows.rows ?? rows) as unknown as RecentDay[];
}
