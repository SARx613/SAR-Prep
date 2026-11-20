import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getByIds } from '@/content';
import { questionIndex } from '@/content/qindex';
import { MockReviewViewer } from '@/components/mock/MockReviewViewer';
import { MOCK_COUNT, MOCK_SECTION2_LEVEL, buildPart, mockSeed, type Level, type Section } from '@/lib/mock';

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
  const m = /^m([1-9])$/.exec(kind);
  if (!m || Number(m[1]) > MOCK_COUNT || (section !== 'verbal' && section !== 'quant')) notFound();

  const sec = section as Section;
  const level: Level = lv === 'easy' || lv === 'medium' ? lv : MOCK_SECTION2_LEVEL;
  const index = questionIndex();
  const seed = mockSeed(kind);
  const first = buildPart(index, sec, 1, 'avg', seed);
  const second = buildPart(index, sec, 2, level, seed, new Set(first));
  const part1Questions = getByIds(first);
  const part2Questions = getByIds(second);
  if (part1Questions.length === 0 && part2Questions.length === 0) notFound();

  return (
    <MockReviewViewer
      kind={kind}
      mockNum={Number(m[1])}
      section={sec}
      level={level}
      part1Questions={part1Questions}
      part2Questions={part2Questions}
    />
  );
}
