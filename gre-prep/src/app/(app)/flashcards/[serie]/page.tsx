import { VocabSession } from '@/components/vocab/VocabSession';

export default async function VocabularySessionPage({ params }: { params: Promise<{ serie: string }> }) {
  const { serie } = await params;
  return <VocabSession seriesId={serie} />;
}
