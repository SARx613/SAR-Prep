'use client';

import { BrainCircuit } from 'lucide-react';
import { SeriesPicker } from '@/components/series/SeriesPicker';

export default function GamesPage() {
  return (
    <SeriesPicker
      basePath="/games"
      title="Train"
      icon={<BrainCircuit size={22} color="var(--emerald)" style={{ flexShrink: 0 }} />}
      accent="var(--emerald)"
      subtitle="Same series, as multiple choice or typing. Replay a series you saw as flashcards to check the words are really known."
    />
  );
}
