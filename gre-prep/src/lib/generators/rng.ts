/* Seeded RNG.
 *
 * Generation must be reproducible: the same seed yields the same bank, so a
 * bad item can be traced back to the template and parameters that produced
 * it, and a regenerated bank is stable rather than churning every run.
 * mulberry32 — small, fast, good enough for item parameters.
 */

export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Uniform in [0, 1). */
  next(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max], inclusive. */
  int(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(items: readonly T[]): T {
    return items[this.int(0, items.length - 1)];
  }

  /** Fisher-Yates on a copy. */
  shuffle<T>(items: readonly T[]): T[] {
    const out = [...items];
    for (let i = out.length - 1; i > 0; i--) {
      const j = this.int(0, i);
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  /** `count` distinct items, or all of them if the pool is smaller. */
  sample<T>(items: readonly T[], count: number): T[] {
    return this.shuffle(items).slice(0, Math.min(count, items.length));
  }

  bool(pTrue = 0.5): boolean {
    return this.next() < pTrue;
  }

  /** Integer in [min, max] excluding 0 — for coefficients that must not vanish. */
  nonZeroInt(min: number, max: number): number {
    let v = 0;
    while (v === 0) v = this.int(min, max);
    return v;
  }
}

/** Stable 32-bit hash, for deriving a per-item seed from a string key. */
export function hashSeed(key: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
