import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getByIds, getExamPart } from '@/content';
import { questionIndex } from '@/content/qindex';
import { MockReviewViewer } from '@/components/mock/MockReviewViewer';
import { MOCK_SECTION2_LEVEL, buildPart, isBankMockKind, isExamKind, mockLabel, mockSeed, type Level, type Section } from '@/lib/mock';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Mock review' };

export default async function MockReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ kind: string; section: string }>;
  searchParams: Promise<{ level?: string }>;
}) {
  const { kind, section } = await params;
  const { level: lv } = await searchParams;
  if (!(isBankMockKind(kind) || isExamKind(kind)) || (section !== 'verbal' && section !== 'quant')) notFound();

  const sec = section as Section;
  const exam = isExamKind(kind);
  const level: Level = exam ? 'hard' : lv === 'easy' || lv === 'medium' ? lv : MOCK_SECTION2_LEVEL;
  let part1Questions, part2Questions;
  if (exam) {
    part1Questions = getExamPart(kind, sec, 1);
    part2Questions = getExamPart(kind, sec, 2);
  } else {
    const index = questionIndex();
    const seed = mockSeed(kind);
    const first = buildPart(index, sec, 1, 'avg', seed);
    part1Questions = getByIds(first);
    part2Questions = getByIds(buildPart(index, sec, 2, level, seed, new Set(first)));
  }
  if (part1Questions.length === 0 && part2Questions.length === 0) notFound();

  return (
    <MockReviewViewer
      kind={kind}
      label={mockLabel(kind)}
      section={sec}
      level={level}
      part1Questions={part1Questions}
      part2Questions={part2Questions}
    />
  );
}
