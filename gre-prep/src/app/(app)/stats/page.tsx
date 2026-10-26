import type { Metadata } from 'next';
import { getChapters, content } from '@/content';
import { StatsPanel } from '@/components/stats/StatsPanel';

export const metadata: Metadata = { title: 'Stats' };
export const dynamic = 'force-dynamic';

export default function StatsPage() {
  const chapters = getChapters();
  const lessons = chapters.flatMap((c) => c.lessons.map((l) => ({ id: l.meta.id, title: l.meta.title, chapter: c.id, chapterTitle: c.title })));
  const est: Record<string, number> = {};
  for (const qs of content().questionSets.values()) for (const q of qs) est[q.id] = q.estSeconds;
  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
      <h1 className="text-3xl font-extrabold tracking-tight">Stats</h1>
      <p className="mt-1 mb-6 max-w-prose text-muted">Where you are strong, where you slip, and how you spend your time.</p>
      <StatsPanel lessons={lessons} est={est} />
    </div>
  );
}
