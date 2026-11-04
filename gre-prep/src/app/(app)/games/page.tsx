import { redirect } from 'next/navigation';

// The practice modes now live inside every vocabulary session.
export default function GamesPage() {
  redirect('/flashcards');
}
