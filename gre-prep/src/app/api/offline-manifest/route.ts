import { content, getChapters } from '@/content';

/* Every page worth having offline: lessons and their practice sets. The
 * client fetches each one; the service worker caches the responses. Practice
 * sets are the same HTML for every mode, so one URL per set is enough. */
export const dynamic = 'force-dynamic';

export function GET() {
  const c = content();
  const urls: string[] = ['/', '/learn', '/practice', '/review', '/stats', '/plan', '/mock', '/settings'];
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
