'use client';

import { Layers } from 'lucide-react';
import { SeriesPicker } from '@/components/series/SeriesPicker';

export default function FlashcardsPage() {
  return (
    <SeriesPicker
      basePath="/flashcards"
      title="Flashcards"
      icon={<Layers size={22} color="var(--violet)" style={{ flexShrink: 0 }} />}
      accent="var(--violet)"
      subtitle="Le deck est découpé en séries courtes, groupées par thème. Choisis-en une, va au bout, recommence-la : c’est la répétition qui fait rentrer les mots, pas la longueur de la liste."
    />
  );
}
