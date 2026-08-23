'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { usersProgress } from '@/db/schema';
import { auth } from '@/auth';
import type { UserProgress } from '@/types';

/**
 * Server-side progress access.
 *
 * Supabase enforced per-user isolation in the database via RLS. Neon has no
 * equivalent, so isolation lives here instead: the user id always comes from
 * the session, never from the caller. No action accepts a userId argument.
 */

export async function getProgress(): Promise<UserProgress | null> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const [row] = await db
    .select()
    .from(usersProgress)
    .where(eq(usersProgress.userId, userId))
    .limit(1);

  if (!row) return null;

  return {
    masteredIds: row.masteredIds,
    reviewIds: row.reviewIds,
    sessionScore: row.sessionScore,
    lives: row.lives,
    totalSeen: row.totalSeen,
  };
}

export async function saveProgress(
  progress: UserProgress
): Promise<{ ok: boolean; error?: string }> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: 'not authenticated' };

  try {
    await db
      .insert(usersProgress)
      .values({
        userId,
        masteredIds: progress.masteredIds,
        reviewIds: progress.reviewIds,
        sessionScore: progress.sessionScore,
        lives: progress.lives,
        totalSeen: progress.totalSeen,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: usersProgress.userId,
        set: {
          masteredIds: progress.masteredIds,
          reviewIds: progress.reviewIds,
          sessionScore: progress.sessionScore,
          lives: progress.lives,
          totalSeen: progress.totalSeen,
          updatedAt: new Date(),
        },
      });
    return { ok: true };
  } catch (e) {
    console.error('[Progress] Save failed:', e);
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

/**
 * Called on sign-in: union the id sets, keep the best counters.
 * Mirrors the previous Supabase merge so no local progress is lost.
 */
export async function mergeProgress(
  local: UserProgress
): Promise<UserProgress> {
  const cloud = await getProgress();
  if (!cloud) {
    await saveProgress(local);
    return local;
  }

  const merged: UserProgress = {
    masteredIds: Array.from(new Set([...local.masteredIds, ...cloud.masteredIds])),
    reviewIds: Array.from(new Set([...local.reviewIds, ...cloud.reviewIds])),
    sessionScore: Math.max(local.sessionScore, cloud.sessionScore),
    lives: Math.min(local.lives, cloud.lives),
    totalSeen: Math.max(local.totalSeen, cloud.totalSeen),
  };

  await saveProgress(merged);
  return merged;
}
