import { content, getChapters } from '@/content';
import { SERIES } from '@/lib/series-data';
import { MOCK_COUNT } from '@/lib/mock';
import writing from '../../../../content/writing-prompts.json';

/* Every page worth having offline: lessons and their practice sets. The
 * client fetches each one; the service worker caches the responses. Practice
 * sets are the same HTML for every mode, so one URL per set is enough. */
export const dynamic = 'force-dynamic';

export function GET() {
  const c = content();
  const urls: string[] = ['/', '/learn', '/practice', '/review', '/stats', '/plan', '/mock', '/settings', '/more', '/games', '/flashcards', '/writing'];
  for (const s of SERIES) urls.push(`/games/${s.id}`, `/flashcards/${s.id}`);
  for (const p of writing.prompts) urls.push(`/writing/session?prompt=${p.id}`);
  // Mock tests: every section, and every difficulty of the adaptive second part.
  urls.push('/mock/run/diag/diag/1');
  for (let i = 1; i <= MOCK_COUNT; i++) {
    for (const sec of ['verbal', 'quant']) {
      urls.push(`/mock/run/m${i}/${sec}/1`);
      for (const lv of ['easy', 'medium', 'hard']) urls.push(`/mock/run/m${i}/${sec}/2?level=${lv}`);
    }
  }
  for (const ch of getChapters()) {
    urls.push(`/learn/${ch.id}`, `/exam/chapter-${ch.id}`);
    for (const l of ch.lessons) {
      if (!l.available) continue;
      urls.push(`/learn/${ch.id}/${l.meta.id}`);
      if (c.questionSets.has(l.meta.id)) urls.push(`/exam/${l.meta.id}`);
    }
  }
  return Response.json({ urls });
}
