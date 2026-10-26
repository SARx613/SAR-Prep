/* A light index of every playable question, for building custom sets. */

import { content, isPlayable } from './index';
import { sectionOf } from '@/types/questions';

export interface QIndexItem {
  id: string;
  lessonId: string;
  chapter: string;
  type: string;
  section: 'verbal' | 'quant';
  difficulty: number;
}

export function questionIndex(): QIndexItem[] {
  const c = content();
  const out: QIndexItem[] = [];
  for (const [setId, qs] of c.questionSets) {
    for (const q of qs) {
      if (!isPlayable(q)) continue;
      out.push({
        id: q.id, lessonId: setId, chapter: setId.split('-')[0], type: q.type,
        section: sectionOf(q.type), difficulty: q.difficulty,
      });
    }
  }
  return out;
}
