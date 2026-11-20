'use server';

import { getByIds } from '@/content';
import type { ClientQuestion } from '@/content/types';

export async function fetchQuestionsByIds(ids: string[]): Promise<ClientQuestion[]> {
  return getByIds(ids.slice(0, 80));
}
