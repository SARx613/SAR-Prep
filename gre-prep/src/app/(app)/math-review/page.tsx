import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MathReviewHub } from '@/components/mathreview/MathReviewHub';
import { loadParts } from '@/lib/mathreview-data';

export const metadata: Metadata = { title: 'Math Review exercises' };

// Private study material: absent from public deployments, so read it per request.
export const dynamic = 'force-dynamic';

export default function MathReviewPage() {
  const parts = loadParts();
  if (!parts.length) notFound();
  return <MathReviewHub parts={parts} />;
}
