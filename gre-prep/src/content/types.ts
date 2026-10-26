/* Types shared by server and client: what a page or the exam player receives.
 * No fs access here — safe to import from client components. */

import type { Question } from '@/types/questions';
import type { FigureSpec, LessonContent, PassageSpec, SyllabusLesson } from './schema';

/** A question with everything it needs attached, so the client never joins. */
export type ClientQuestion = Question & {
  lessonId: string;
  estSeconds: number;
  choiceExplanations?: Record<string, string>;
  /** RC: the passage. */
  passage?: PassageSpec;
  /** DI and geometry: the figure. */
  figureSpec?: FigureSpec;
};

export interface LessonView {
  meta: SyllabusLesson;
  body: LessonContent;
  checks: ClientQuestion[];
  practiceCount: number;
}
