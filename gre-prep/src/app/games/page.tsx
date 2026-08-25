'use client';

import { BrainCircuit } from 'lucide-react';
import { SeriesPicker } from '@/components/series/SeriesPicker';

export default function GamesPage() {
  return (
    <SeriesPicker
      basePath="/games"
      title="S'entraîner"
      icon={<BrainCircuit size={22} color="var(--emerald)" style={{ flexShrink: 0 }} />}
      accent="var(--emerald)"
      subtitle="Mêmes séries, mais en QCM ou en frappe au clavier. Reprends une série déjà vue en flashcards pour vérifier que les mots sont vraiment acquis."
    />
  );
}
