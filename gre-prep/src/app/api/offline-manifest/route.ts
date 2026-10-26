import { content, getChapters } from '@/content';

/* Every page worth having offline: lessons and their practice sets. The
 * client fetches each one; the service worker caches the responses. */
export const dynamic = 'force-dynamic';

export function GET() {
  const c = content();
  const urls: string[] = [];
  for (const ch of getChapters()) {
    urls.push(`/learn/${ch.id}`);
    for (const l of ch.lessons) {
      if (!l.available) continue;
      urls.push(`/learn/${ch.id}/${l.meta.id}`);
      if (c.questionSets.has(l.meta.id)) urls.push(`/exam/${l.meta.id}?mode=tutor`, `/exam/${l.meta.id}?mode=timed`);
    }
  }
  return Response.json({ urls });
}
