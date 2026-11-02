import { readPrivateJson } from '@/lib/private-content';
import type { MathPart } from '@/lib/mathreview';

/** The exercise deck, or [] when the private material is not installed. */
export function loadParts(): MathPart[] {
  return readPrivateJson<{ parts: MathPart[] }>('math-review.json')?.parts ?? [];
}
