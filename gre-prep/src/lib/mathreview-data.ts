import { readPrivateJson } from '@/lib/private-content';
import { hasPrivateAccess } from '@/lib/private-access';
import type { MathPart } from '@/lib/mathreview';

/** The exercise deck, or [] when the material is not installed or the user is not allowed. */
export async function loadParts(): Promise<MathPart[]> {
  if (!(await hasPrivateAccess())) return [];
  return readPrivateJson<{ parts: MathPart[] }>('math-review.json')?.parts ?? [];
}
