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
  /** RC: the passage these questions share. */
  passageId?: string;
  /** DI: items that share one figure share this key. */
  figureKey?: string;
}

function hash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

export function questionIndex(): QIndexItem[] {
  const c = content();
  const out: QIndexItem[] = [];
  for (const [setId, qs] of c.questionSets) {
    for (const q of qs) {
      if (!isPlayable(q)) continue;
      out.push({
        passageId: q.passageId, figureKey: q.figure ? hash(JSON.stringify(q.figure)) : undefined,
        id: q.id, lessonId: setId, chapter: setId.split('-')[0], type: q.type,
        section: sectionOf(q.type), difficulty: q.difficulty,
      });
    }
  }
  return out;
}
