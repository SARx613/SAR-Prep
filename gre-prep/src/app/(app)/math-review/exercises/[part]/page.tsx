import { notFound } from 'next/navigation';
import { ExerciseDeck } from '@/components/mathreview/ExerciseDeck';
import { loadParts } from '@/lib/mathreview-data';

export const metadata = { title: 'Math Review exercises' };

export default async function ExercisesPage({ params }: { params: Promise<{ part: string }> }) {
  const { part } = await params;
  const found = (await loadParts()).find((p) => p.id === part);
  if (!found) notFound();
  return <ExerciseDeck part={found} />;
}
