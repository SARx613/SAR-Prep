import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import data from '../../../../content/writing-prompts.json';
import { EssayEditor } from '@/components/writing/EssayEditor';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Essay' };

export default async function SessionPage({ searchParams }: { searchParams: Promise<{ prompt?: string; custom?: string; set?: string }> }) {
  const { prompt, custom, set } = await searchParams;
  const instructions = data.instructions as Record<string, string>;
  let claim = '', instruction = '';
  if (custom && instructions[set ?? '']) { claim = custom.slice(0, 600); instruction = instructions[set!]; }
  else {
    const p = data.prompts.find((x) => x.id === prompt);
    if (!p) notFound();
    claim = p.claim; instruction = instructions[p.set];
  }
  return <EssayEditor claim={claim} instruction={instruction} aiEnabled={!!process.env.ANTHROPIC_API_KEY} />;
}
