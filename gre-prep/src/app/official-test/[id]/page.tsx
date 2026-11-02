import { notFound } from 'next/navigation';
import { getExam } from '@/app/actions/official';
import { ExamRunner } from '@/components/official/ExamRunner';

export const metadata = { title: 'Test complet — SAR Prep' };

export default async function ExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exam = await getExam(id);
  if (!exam) notFound();
  return <ExamRunner exam={exam} />;
}
