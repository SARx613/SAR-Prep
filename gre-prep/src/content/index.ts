/* Server-side content access for pages. Reads content/ once per process
 * (every request in dev, so edits show without a restart). */

import { loadContent, type RawContent } from './load';
import { pickChapterTest, type ChapterTestOptions } from '@/lib/chapter-test';
import { sectionOf } from '@/types/questions';
import type { ContentQuestionInput, SyllabusLesson } from './schema';
import type { ClientQuestion, LessonView } from './types';

let cache: RawContent | null = null;

export function content(): RawContent {
  if (process.env.NODE_ENV === 'production' && cache) return cache;
  cache = loadContent();
  return cache;
}

/** Drafts are visible in development and when SAR_SHOW_DRAFTS=1; production shows published only. */
const showDrafts = () => process.env.NODE_ENV !== 'production' || process.env.SAR_SHOW_DRAFTS === '1';

export function toClient(q: ContentQuestionInput, c: RawContent = content(), passages: RawContent['passages'] = c.passages): ClientQuestion {
  const passage = q.passageId ? passages.get(q.passageId) : undefined;
  return {
    id: q.id,
    type: q.type,
    section: sectionOf(q.type),
    topic: q.lessonId,
    subtopic: null,
    difficulty: q.difficulty,
    passageId: q.passageId ?? null,
    figureId: null,
    stem: q.stem,
    content: q.content as ClientQuestion['content'],
    answer: q.answer as ClientQuestion['answer'],
    explanation: q.explanation,
    source: 'sar-prep',
    tags: q.skills,
    lessonId: q.lessonId,
    estSeconds: q.estSeconds,
    choiceExplanations: q.choiceExplanations,
    passage,
    figureSpec: q.figure,
  };
}

export function isPlayable(q: ContentQuestionInput): boolean {
  return showDrafts() || q.review.status === 'published';
}

export function getSet(setId: string): ClientQuestion[] {
  const c = content();
  // Easiest to hardest, as the lesson page promises; the sort is stable, so authors' order breaks ties.
  return (c.questionSets.get(setId) ?? [])
    .filter(isPlayable)
    .map((q, i) => ({ q, i }))
    .sort((a, b) => a.q.difficulty - b.q.difficulty || a.i - b.i)
    .map(({ q }) => toClient(q, c));
}

export interface LessonCard {
  meta: SyllabusLesson;
  available: boolean;
  practiceCount: number;
}

export function getChapters() {
  const c = content();
  return c.syllabus.chapters
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((ch) => {
      const lessons: LessonCard[] = c.syllabus.lessons
        .filter((l) => l.chapter === ch.id)
        .sort((a, b) => a.order - b.order)
        .map((meta) => {
          const body = c.lessons.get(meta.id);
          const available = !!body && (showDrafts() || body.status === 'published');
          return { meta, available, practiceCount: available ? getSet(meta.id).length : 0 };
        });
      return { ...ch, lessons };
    });
}

export function getChapter(id: string) {
  return getChapters().find((c) => c.id === id) ?? null;
}

export function getLesson(id: string): LessonView | null {
  const c = content();
  const meta = c.syllabus.lessons.find((l) => l.id === id);
  const body = c.lessons.get(id);
  if (!meta || !body) return null;
  if (!showDrafts() && body.status !== 'published') return null;
  return { meta, body, checks: body.checks.map((q) => toClient(q, c)), practiceCount: getSet(id).length };
}

/** Previous and next *available* lessons across the whole syllabus, for lesson-to-lesson navigation. */
export function neighbours(id: string): { prev: LessonCard | null; next: LessonCard | null } {
  const flat = getChapters().flatMap((ch) => ch.lessons).filter((l) => l.available);
  const i = flat.findIndex((l) => l.meta.id === id);
  return { prev: i > 0 ? flat[i - 1] : null, next: i >= 0 && i < flat.length - 1 ? flat[i + 1] : null };
}

export function getSource(id: string) {
  return content().sources.find((s) => s.id === id) ?? null;
}

/** Questions by id, in the order given (unknown or unplayable ids are skipped). Exam-style mock
 * questions resolve too, so a missed mock question can be reviewed or retried by id. */
export function getByIds(ids: string[]): ClientQuestion[] {
  const c = content();
  const byId = new Map<string, ContentQuestionInput>();
  for (const qs of c.questionSets.values()) for (const q of qs) byId.set(q.id, q);
  const exam = examQuestionMap(c);
  return ids.flatMap((id) => {
    const x = exam.get(id);
    if (x) return [toClient(x.q, c, x.passages)];
    const q = byId.get(id);
    return q && isPlayable(q) ? [toClient(q, c)] : [];
  });
}

/* ── Exam-style mocks (content/exams) ─────────────────────────────────── */

function examQuestionMap(c: RawContent) {
  const out = new Map<string, { q: ContentQuestionInput; passages: RawContent['passages'] }>();
  for (const exam of c.exams.values()) {
    for (const m of [exam.verbal, exam.quant]) {
      if (!m) continue;
      const passages = new Map(m.passages.map((p) => [p.id, p]));
      for (const q of [...m.s1, ...m.s2]) out.set(q.id, { q, passages });
    }
  }
  return out;
}

/** Ids of the exam-style mocks that have both measures written (x1, x2…). */
export function examIds(): string[] {
  return [...content().exams].filter(([, e]) => e.verbal && e.quant).map(([id]) => id);
}

/** One section of an exam-style mock, in the order the author set (as on the real test).
 * These questions are reviewed with the exam, not through the practice pipeline, so they are always shown. */
export function getExamPart(id: string, section: 'verbal' | 'quant', part: 1 | 2): ClientQuestion[] {
  const c = content();
  const m = c.exams.get(id)?.[section];
  if (!m) return [];
  const passages = new Map(m.passages.map((p) => [p.id, p]));
  return (part === 1 ? m.s1 : m.s2).map((q) => toClient(q, c, passages));
}

/** All playable questions in a chapter, ordered by lesson order. */
export function getChapterQuestions(chapterId: string): ClientQuestion[] {
  const c = content();
  const lessons = c.syllabus.lessons.filter((l) => l.chapter === chapterId).sort((a, b) => a.order - b.order);
  return lessons.flatMap((l) => (c.questionSets.get(l.id) ?? []).filter(isPlayable).map((q) => toClient(q, c)));
}

/** A timed test for a whole chapter: up to 20 questions, round-robin across its lessons. */
export function getChapterTest(chapterId: string, opts?: ChapterTestOptions): ClientQuestion[] {
  const pool = getChapterQuestions(chapterId);
  return pickChapterTest(pool, {
    seed: `chapter-test:${chapterId}`,
    ...opts,
  });
}

export interface TopicView {
  id: string;
  title: string;
  kind: string;
  scope?: 'official' | 'extended';
  etsRef?: string;
  /** Playable questions anywhere in the bank that exercise this topic, easiest first. */
  questionIds: string[];
}

/** The topics a lesson hosts (content/topics.json) with the questions that practise each. */
export function getTopics(lessonId: string): TopicView[] {
  const c = content();
  const mine = c.topics.filter((t) => t.lessonId === lessonId);
  if (mine.length === 0) return [];
  const byTopic = new Map<string, ContentQuestionInput[]>();
  const add = (q: ContentQuestionInput) => {
    if (!isPlayable(q)) return;
    for (const t of q.topics) byTopic.set(t, [...(byTopic.get(t) ?? []), q]);
  };
  for (const l of c.lessons.values()) l.checks.forEach(add);
  for (const qs of c.questionSets.values()) qs.forEach(add);
  return mine.map((t) => ({
    id: t.id,
    title: t.title,
    kind: t.kind,
    scope: t.scope,
    etsRef: t.etsRef,
    questionIds: (byTopic.get(t.id) ?? []).sort((a, b) => a.difficulty - b.difficulty).map((q) => q.id),
  }));
}
