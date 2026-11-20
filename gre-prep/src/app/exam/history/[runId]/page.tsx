import type { Metadata } from 'next';
import { getByIds } from '@/content';
import { HistoryRunViewer } from '@/components/exam/HistoryRunViewer';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Saved results' };

export default async function HistoryRunPage({
  params,
  searchParams,
}: {
  params: Promise<{ runId: string }>;
  searchParams: Promise<{ ids?: string }>;
}) {
  const { runId } = await params;
  const { ids } = await searchParams;
  const initialQuestions = getByIds((ids ?? '').split(',').filter(Boolean).slice(0, 80));
  return <HistoryRunViewer runId={decodeURIComponent(runId)} initialQuestions={initialQuestions} />;
}
