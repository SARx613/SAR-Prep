import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getByIds } from '@/content';
import { questionIndex } from '@/content/qindex';
import { MockRunner } from '@/components/mock/MockRunner';
import { MOCK_COUNT, SECTION_MINUTES, buildDiagnostic, buildPart, mockSeed, type Level, type Section } from '@/lib/mock';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Mock test' };

export default async function MockRunPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string; section: string; part: string }>;
  searchParams: Promise<{ level?: string }>;
}) {
  const { kind, section, part } = await params;
  const { level: lv } = await searchParams;
  const index = questionIndex();

  if (kind === 'diag') {
    const d = buildDiagnostic(index);
    const questions = getByIds([...d.verbal, ...d.quant]);
    if (questions.length === 0) notFound();
    return <MockRunner kind="diag" section="diag" part={1} title="Diagnostic" questions={questions} seconds={40 * 60} />;
  }

  const m = /^m([1-9])$/.exec(kind);
  if (!m || Number(m[1]) > MOCK_COUNT || (section !== 'verbal' && section !== 'quant') || (part !== '1' && part !== '2')) notFound();
  const sec = section as Section;
  const p = Number(part) as 1 | 2;
  const level: Level = lv === 'easy' || lv === 'hard' ? lv : 'medium';
  const seed = mockSeed(kind);
  const first = buildPart(index, sec, 1, 'avg', seed);
  const ids = p === 1 ? first : buildPart(index, sec, 2, level, seed, new Set(first));
  const questions = getByIds(ids);
  if (questions.length === 0) notFound();

  return (
    <MockRunner
      kind={kind}
      section={sec}
      part={p}
      level={p === 2 ? level : undefined}
      title={`Mock ${m[1]} · ${sec === 'verbal' ? 'Verbal' : 'Quant'} ${p}`}
      questions={questions}
      seconds={SECTION_MINUTES[sec][p] * 60}
    />
  );
}
