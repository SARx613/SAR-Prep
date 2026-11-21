'use server';

import { getByIds, getExamPart } from '@/content';
import { questionIndex } from '@/content/qindex';
import type { ClientQuestion } from '@/content/types';
import { MOCK_SECTION2_LEVEL, buildPart, isBankMockKind, isExamKind, mockSeed, type Level, type Section } from '@/lib/mock';

export async function fetchQuestionsByIds(ids: string[]): Promise<ClientQuestion[]> {
  return getByIds(ids.slice(0, 80));
}

export async function fetchMockSectionQuestions(
  kind: string,
  section: Section,
  level: Level = MOCK_SECTION2_LEVEL,
): Promise<{ part1: ClientQuestion[]; part2: ClientQuestion[] }> {
  if (section !== 'verbal' && section !== 'quant') return { part1: [], part2: [] };
  if (isExamKind(kind)) return { part1: getExamPart(kind, section, 1), part2: getExamPart(kind, section, 2) };
  if (!isBankMockKind(kind)) return { part1: [], part2: [] };
  const index = questionIndex();
  const seed = mockSeed(kind);
  const first = buildPart(index, section, 1, 'avg', seed);
  const second = buildPart(index, section, 2, level, seed, new Set(first));
  return {
    part1: getByIds(first),
    part2: getByIds(second),
  };
}
