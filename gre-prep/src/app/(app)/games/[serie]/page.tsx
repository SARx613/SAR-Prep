import { redirect } from 'next/navigation';

export default async function GameSeriesPage({ params }: { params: Promise<{ serie: string }> }) {
  const { serie } = await params;
  redirect(`/flashcards/${serie}`);
}
