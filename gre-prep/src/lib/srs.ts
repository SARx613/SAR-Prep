/* Spaced repetition for missed questions (PLAN §7).
 *
 * A question enters the queue when it is answered wrong. It is due 1 day
 * later, then 3, 7, 21 days after each successful repeat; two successes that
 * are genuinely spaced (≥ 12 h after the previous attempt, not a same-session
 * retry) retire it. Practice-mode "check" attempts inside lessons never count.
 * Derived on demand from the attempt log — nothing is stored.
 */

import type { Attempt } from './attempts';

export const INTERVAL_DAYS = [1, 3, 7, 21];
export const RETIRE_AFTER = 2;
const MIN_SPACING_MS = 12 * 3600 * 1000;
const DAY = 24 * 3600 * 1000;

export interface QueueItem {
  qid: string;
  lessonId: string;
  stage: number;
  lastAt: number;
  dueAt: number;
}

export interface Queue {
  due: QueueItem[];
  upcoming: QueueItem[];
  retired: number;
}

export function buildQueue(attempts: Attempt[], now: number = Date.now()): Queue {
  const byQ = new Map<string, Attempt[]>();
  for (const a of attempts) {
    if (a.mode === 'check') continue;
    const l = byQ.get(a.qid);
    if (l) l.push(a); else byQ.set(a.qid, [a]);
  }

  const due: QueueItem[] = [], upcoming: QueueItem[] = [];
  let retired = 0;

  for (const [qid, list] of byQ) {
    list.sort((x, y) => x.ts - y.ts);
    let entered = false, stage = 0, lastAt = 0, lessonId = list[0].lessonId;
    for (const a of list) {
      lessonId = a.lessonId;
      if (!a.correct) {
        entered = true; stage = 0; lastAt = a.ts;
      } else if (entered && a.ts - lastAt >= MIN_SPACING_MS) {
        stage++; lastAt = a.ts;
      }
    }
    if (!entered) continue;
    if (stage >= RETIRE_AFTER) { retired++; continue; }
    const item: QueueItem = { qid, lessonId, stage, lastAt, dueAt: lastAt + INTERVAL_DAYS[Math.min(stage, INTERVAL_DAYS.length - 1)] * DAY };
    (item.dueAt <= now ? due : upcoming).push(item);
  }
  due.sort((a, b) => a.dueAt - b.dueAt);
  upcoming.sort((a, b) => a.dueAt - b.dueAt);
  return { due, upcoming, retired };
}
