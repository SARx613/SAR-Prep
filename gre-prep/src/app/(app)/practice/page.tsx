import type { Metadata } from 'next';
import { getChapters } from '@/content';
import { questionIndex } from '@/content/qindex';
import { QBank } from '@/components/practice/QBank';

export const metadata: Metadata = { title: 'Practice' };
export const dynamic = 'force-dynamic';

export default function PracticePage() {
  const chapters = getChapters().map((c) => ({ id: c.id, title: c.title, track: c.track }));
  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
      <h1 className="text-3xl font-extrabold tracking-tight">Practice</h1>
      <p className="mt-1 max-w-prose text-muted">Build a set from the whole question bank. Every question is in the format of the real test.</p>
      <div className="mt-8"><QBank index={questionIndex()} chapters={chapters} /></div>
    </div>
  );
}
