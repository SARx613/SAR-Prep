/* Server-side content access for pages. Reads content/ once per process
 * (every request in dev, so edits show without a restart). */

import { loadContent, type RawContent } from './load';
import { Rng, hashSeed } from '@/lib/generators/rng';
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

export function toClient(q: ContentQuestionInput, c: RawContent = content()): ClientQuestion {
  const passage = q.passageId ? c.passages.get(q.passageId) : undefined;
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

/** Questions by id, in the order given (unknown or unplayable ids are skipped). */
export function getByIds(ids: string[]): ClientQuestion[] {
  const c = content();
  const byId = new Map<string, ContentQuestionInput>();
  for (const qs of c.questionSets.values()) for (const q of qs) byId.set(q.id, q);
  return ids.flatMap((id) => {
    const q = byId.get(id);
    return q && isPlayable(q) ? [toClient(q, c)] : [];
  });
}

/** A timed test for a whole chapter: up to 20 questions, round-robin across its lessons, levels 2–4 first. */
export function getChapterTest(chapterId: string): ClientQuestion[] {
  const c = content();
  const lessons = c.syllabus.lessons.filter((l) => l.chapter === chapterId).sort((a, b) => a.order - b.order);
  const rng = new Rng(hashSeed(`chapter-test:${chapterId}`));
  const lists = lessons.map((l) => {
    const qs = (c.questionSets.get(l.id) ?? []).filter(isPlayable);
    const mid = qs.filter((q) => q.difficulty >= 2 && q.difficulty <= 4);
    const rest = qs.filter((q) => q.difficulty < 2 || q.difficulty > 4);
    const shuffle = <T,>(xs: T[]) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = rng.int(0, i); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    return [...shuffle(mid), ...shuffle(rest)];
  });
  const picked: ContentQuestionInput[] = [];
  for (let round = 0; picked.length < 20 && round < 40; round++) {
    for (const l of lists) { if (picked.length < 20 && l[round]) picked.push(l[round]); }
  }
  return picked.map((q) => toClient(q, c));
}
