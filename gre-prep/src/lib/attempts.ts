/* Local attempt log — the offline-first record of every graded answer.
 * Phase 6 syncs this to the database; until then it drives progress and stats. */

export interface Attempt {
  qid: string;
  lessonId: string;
  type: string;
  difficulty: number;
  correct: boolean;
  ms: number;
  ts: number;
  mode: 'tutor' | 'timed' | 'check' | 'mock';
}

export const ATTEMPTS_KEY = 'sar-attempts-v1';
const MAX = 20000;

export function readAttempts(): Attempt[] {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    return raw ? (JSON.parse(raw) as Attempt[]) : [];
  } catch {
    return [];
  }
}

export function recordAttempts(batch: Attempt[]): void {
  if (batch.length === 0) return;
  try {
    const all = readAttempts().concat(batch);
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(all.slice(-MAX)));
    window.dispatchEvent(new Event('gre-prep:storage'));
  } catch {
    /* storage full or blocked: the session still works, it just isn't kept */
  }
}

export interface Summary {
  attempted: number;
  correct: number;
  /** Questions whose most recent attempt was wrong. */
  missedIds: string[];
  /** Questions whose most recent attempt was right. */
  masteredIds: string[];
}

export function summarise(attempts: Attempt[]): Summary {
  const last = new Map<string, boolean>();
  for (const a of attempts) last.set(a.qid, a.correct);
  const missedIds: string[] = [], masteredIds: string[] = [];
  for (const [id, ok] of last) (ok ? masteredIds : missedIds).push(id);
  return {
    attempted: last.size,
    correct: attempts.filter((a) => a.correct).length,
    missedIds,
    masteredIds,
  };
}
