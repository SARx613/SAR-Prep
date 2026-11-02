import part1 from '../../content/writing-models/part-1.json';
import part2 from '../../content/writing-models/part-2.json';
import part3 from '../../content/writing-models/part-3.json';
import type { WritingModel } from '@/types/writing';

export const WRITING_MODELS: WritingModel[] = [part1, part2, part3].flatMap(
  (p) => (p as unknown as { models: WritingModel[] }).models,
);

export const getWritingModel = (promptId: string): WritingModel | undefined =>
  WRITING_MODELS.find((m) => m.promptId === promptId);

export const hasSamples = (promptId: string): boolean => Boolean(getWritingModel(promptId)?.samples?.length);
