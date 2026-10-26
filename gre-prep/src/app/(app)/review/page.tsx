import type { Metadata } from 'next';
import { content } from '@/content';
import { ReviewPanel } from '@/components/practice/ReviewPanel';

export const metadata: Metadata = { title: 'Review' };
export const dynamic = 'force-dynamic';

export default function ReviewPage() {
  const titles = Object.fromEntries(content().syllabus.lessons.map((l) => [l.id, l.title]));
  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
      <h1 className="text-3xl font-extrabold tracking-tight">Review</h1>
      <p className="mt-1 max-w-prose text-muted">Missed questions come back after 1 and 3 days. Two spaced successes and they are done.</p>
      <div className="mt-8"><ReviewPanel titles={titles} /></div>
    </div>
  );
}
