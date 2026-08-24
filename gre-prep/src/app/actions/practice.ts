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
