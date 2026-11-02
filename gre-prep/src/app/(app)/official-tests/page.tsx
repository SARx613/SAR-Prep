import { notFound } from 'next/navigation';
import { listExams } from '@/app/actions/official';
import { ExamsIndex } from '@/components/official/ExamsIndex';

export const metadata = { title: 'Official tests' };

// Private study material: only for allowed users, so read it per request.
export const dynamic = 'force-dynamic';

export default async function ExamsPage() {
  const exams = await listExams();
  if (!exams.length) notFound();
  return <ExamsIndex exams={exams} />;
}
