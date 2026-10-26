import type { Metadata } from 'next';
import { content, getChapters } from '@/content';
import { PlanPanel, type PlanSource } from '@/components/mock/PlanPanel';

export const metadata: Metadata = { title: 'Study plan' };
export const dynamic = 'force-dynamic';

export default function PlanPage() {
  const c = content();
  const lessons: PlanSource[] = getChapters()
    .filter((ch) => ch.track === 'quant' || ch.track === 'verbal' || ch.track === 'writing')
    .flatMap((ch) => ch.lessons.filter((l) => l.available).map((l) => {
      const qs = c.questionSets.get(l.meta.id) ?? [];
      return { id: l.meta.id, chapter: ch.id, title: l.meta.title, readMinutes: l.meta.estMinutes, qCount: qs.length, qSeconds: qs.reduce((a, q) => a + q.estSeconds, 0) };
    }));
  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
      <h1 className="text-3xl font-extrabold tracking-tight">Study plan</h1>
      <p className="mt-1 mb-6 max-w-prose text-muted">What is left, spread across the weeks until your test. It updates as you finish lessons.</p>
      <PlanPanel lessons={lessons} />
    </div>
  );
}
