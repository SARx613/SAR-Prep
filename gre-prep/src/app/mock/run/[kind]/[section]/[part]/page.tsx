import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getByIds, getExamPart } from '@/content';
import { questionIndex } from '@/content/qindex';
import { MockRunner } from '@/components/mock/MockRunner';
import { SECTION_MINUTES, buildDiagnostic, buildPart, isBankMockKind, isExamKind, mockLabel, mockSeed, type Level, type Section } from '@/lib/mock';

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

  if (!(isBankMockKind(kind) || isExamKind(kind)) || (section !== 'verbal' && section !== 'quant') || (part !== '1' && part !== '2')) notFound();
  const sec = section as Section;
  const p = Number(part) as 1 | 2;
  const sectionName = sec === 'verbal' ? 'Verbal' : 'Quant';

  if (isExamKind(kind)) {
    // Hand-built exam: fixed questions, section 2 is the hard module.
    const questions = getExamPart(kind, sec, p);
    if (questions.length === 0) notFound();
    return (
      <MockRunner
        kind={kind}
        section={sec}
        part={p}
        level={p === 2 ? 'hard' : undefined}
        title={`${mockLabel(kind)} · ${sectionName} ${p}${p === 2 ? ' (Hard)' : ''}`}
        questions={questions}
        part1Questions={p === 2 ? getExamPart(kind, sec, 1) : undefined}
        seconds={SECTION_MINUTES[sec][p] * 60}
      />
    );
  }

  const level: Level = lv === 'easy' || lv === 'medium' ? lv : 'hard';
  const seed = mockSeed(kind);
  const first = buildPart(index, sec, 1, 'avg', seed);
  const ids = p === 1 ? first : buildPart(index, sec, 2, level, seed, new Set(first));
  const questions = getByIds(ids);
  if (questions.length === 0) notFound();
  const part1Questions = p === 2 ? getByIds(first) : undefined;

  return (
    <MockRunner
      kind={kind}
      section={sec}
      part={p}
      level={p === 2 ? level : undefined}
      title={`${mockLabel(kind)} · ${sectionName} ${p}${p === 2 && level === 'hard' ? ' (Hard)' : ''}`}
      questions={questions}
      part1Questions={part1Questions}
      seconds={SECTION_MINUTES[sec][p] * 60}
    />
  );
}
