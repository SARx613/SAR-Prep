'use server';

import { getByIds } from '@/content';
import { questionIndex } from '@/content/qindex';
import type { ClientQuestion } from '@/content/types';
import { MOCK_COUNT, MOCK_SECTION2_LEVEL, buildPart, mockSeed, type Level, type Section } from '@/lib/mock';

export async function fetchQuestionsByIds(ids: string[]): Promise<ClientQuestion[]> {
  return getByIds(ids.slice(0, 80));
}

export async function fetchMockSectionQuestions(
  kind: string,
  section: Section,
  level: Level = MOCK_SECTION2_LEVEL,
): Promise<{ part1: ClientQuestion[]; part2: ClientQuestion[] }> {
  const m = /^m([1-9])$/.exec(kind);
  if (!m || Number(m[1]) > MOCK_COUNT) return { part1: [], part2: [] };
  const index = questionIndex();
  const seed = mockSeed(kind);
  const first = buildPart(index, section, 1, 'avg', seed);
  const second = buildPart(index, section, 2, level, seed, new Set(first));
  return {
    part1: getByIds(first),
    part2: getByIds(second),
  };
}
