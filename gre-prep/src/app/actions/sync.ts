'use server';

import { asc, eq } from 'drizzle-orm';
import { db } from '@/db';
import { attemptLog, userState } from '@/db/schema';
import { auth } from '@/auth';
import type { Attempt } from '@/lib/attempts';
import type { SyncState } from '@/lib/sync';

/* The user id always comes from the session; no action accepts one. */

async function uid(): Promise<string | null> {
  return (await auth())?.user?.id ?? null;
}

export async function pullAttempts(): Promise<Attempt[]> {
  const userId = await uid();
  if (!userId) return [];
  const rows = await db.select().from(attemptLog).where(eq(attemptLog.userId, userId)).orderBy(asc(attemptLog.ts)).limit(20000);
  return rows.map((r) => ({
    qid: r.qid, lessonId: r.lessonId, type: r.type, difficulty: r.difficulty,
    correct: r.correct, ms: r.ms, mode: r.mode as Attempt['mode'], ts: r.ts.getTime(),
  }));
}

export async function pushAttempts(batch: Attempt[]): Promise<{ ok: boolean }> {
  const userId = await uid();
  if (!userId || batch.length === 0) return { ok: !!userId };
  try {
    for (let i = 0; i < batch.length; i += 500) {
      await db
        .insert(attemptLog)
        .values(batch.slice(i, i + 500).map((a) => ({
          userId, qid: a.qid, lessonId: a.lessonId, type: a.type, difficulty: a.difficulty,
          correct: a.correct, ms: Math.max(0, Math.round(a.ms)), mode: a.mode, ts: new Date(a.ts),
        })))
        .onConflictDoNothing();
    }
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

export async function pullState(): Promise<SyncState | null> {
  const userId = await uid();
  if (!userId) return null;
  const [row] = await db.select().from(userState).where(eq(userState.userId, userId)).limit(1);
  return (row?.state as SyncState | undefined) ?? null;
}

export async function pushState(state: SyncState): Promise<{ ok: boolean }> {
  const userId = await uid();
  if (!userId) return { ok: false };
  try {
    await db
      .insert(userState)
      .values({ userId, state, updatedAt: new Date() })
      .onConflictDoUpdate({ target: userState.userId, set: { state, updatedAt: new Date() } });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

