import type { Metadata } from 'next';
import data from '../../../../content/writing-prompts.json';
import { WritingHub } from '@/components/writing/WritingHub';

export const metadata: Metadata = { title: 'Writing' };

export default function WritingPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
      <h1 className="text-3xl font-extrabold tracking-tight">Writing</h1>
      <p className="mt-1 mb-6 max-w-prose text-muted">One 30-minute “Analyze an Issue” essay, typed in a plain editor with no spell-check — like the real test.</p>
      <WritingHub prompts={data.prompts} instructions={data.instructions} />
    </div>
  );
}
