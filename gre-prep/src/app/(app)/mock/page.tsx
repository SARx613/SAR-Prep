import type { Metadata } from 'next';
import { MockHub } from '@/components/mock/MockHub';

export const metadata: Metadata = { title: 'Mock tests' };

export default function MockPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 sm:px-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
      <h1 className="text-3xl font-extrabold tracking-tight">Mock tests</h1>
      <p className="mt-1 mb-6 max-w-prose text-muted">Full-length sections with the real timing and structure: Verbal 12 + 15 questions, Quant 12 + 15.</p>
      <MockHub />
    </div>
  );
}
