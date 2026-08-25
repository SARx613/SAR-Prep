import { Layers } from 'lucide-react';
import { SeriesSession } from '@/components/series/SeriesSession';

export default async function FlashcardSeriesPage({
  params,
}: {
  params: Promise<{ serie: string }>;
}) {
  const { serie } = await params;

  return (
    <SeriesSession
      seriesId={serie}
      playMode="flashcard"
      basePath="/flashcards"
      accent="var(--violet)"
      icon={<Layers size={22} color="var(--violet)" style={{ flexShrink: 0 }} />}
    />
  );
}
