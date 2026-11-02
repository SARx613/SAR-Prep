import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import data from '../../../../../../content/writing-prompts.json';
import { WritingModelView } from '@/components/writing/WritingModelView';
import { WRITING_MODELS, getWritingModel } from '@/lib/writing-models';

export const metadata: Metadata = { title: 'Model answers' };

export function generateStaticParams() {
  return WRITING_MODELS.map((m) => ({ id: m.promptId }));
}

export default async function ModelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const model = getWritingModel(id);
  const prompt = data.prompts.find((p) => p.id === id);
  if (!model || !prompt) notFound();
  const instruction = (data.instructions as Record<string, string>)[prompt.set];
  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 sm:px-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
      <Link href="/writing" className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ink hover:underline">
        <ArrowLeft size={14} aria-hidden /> Writing
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold tracking-tight">{prompt.claim}</h1>
      <p className="mt-2 text-sm text-muted">{instruction}</p>
      <WritingModelView model={model} promptId={id} />
    </div>
  );
}
