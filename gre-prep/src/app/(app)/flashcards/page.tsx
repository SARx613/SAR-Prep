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
      subtitle="The deck is cut into short series grouped by theme. Pick one, finish it, then replay it: repetition is what makes words stick, not the length of the list."
    />
  );
}
