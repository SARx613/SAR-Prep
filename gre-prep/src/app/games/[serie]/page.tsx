import { BrainCircuit } from 'lucide-react';
import { SeriesSession } from '@/components/series/SeriesSession';

export default async function GameSeriesPage({
  params,
}: {
  params: Promise<{ serie: string }>;
}) {
  const { serie } = await params;

  return (
    <SeriesSession
      seriesId={serie}
      playMode="mix"
      basePath="/games"
      accent="var(--emerald)"
      icon={<BrainCircuit size={22} color="var(--emerald)" style={{ flexShrink: 0 }} />}
      modeToggle
    />
  );
}
