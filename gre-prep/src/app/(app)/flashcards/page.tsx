import type { Metadata } from 'next';
import { VocabHub } from '@/components/vocab/VocabHub';

export const metadata: Metadata = { title: 'Vocabulary' };

export default function VocabularyPage() {
  return <VocabHub />;
}
