import { createClient } from '@/utils/supabase/client';
import { UserProgress } from '@/types';
import { loadProgress, saveProgress } from './storage';

/** Get current user from local session (fast, no network) */
export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user ?? null;
}

/** Load progress row from Supabase for the current user */
export async function loadCloudProgress(): Promise<UserProgress | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from('users_progress')
    .select('*')
    .eq('user_id', session.user.id)
    .single();

  if (error || !data) return null;

  return {
    masteredIds: data.mastered_ids ?? [],
    reviewIds: data.review_ids ?? [],
    sessionScore: data.session_score ?? 0,
    lives: data.lives ?? 5,
    totalSeen: data.total_seen ?? 0,
  };
}

/** Save progress to Supabase — silently fails if not authenticated */
export async function saveCloudProgress(progress: UserProgress): Promise<void> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return;

  await supabase.from('users_progress').upsert(
    {
      user_id: session.user.id,
      mastered_ids: progress.masteredIds,
      review_ids: progress.reviewIds,
      session_score: progress.sessionScore,
      lives: progress.lives,
      total_seen: progress.totalSeen,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
}

/** Trigger Google OAuth sign-in */
export async function signInWithGoogle(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}

/** Sign out */
export async function signOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

/**
 * Called on sign-in: merge local + cloud progress, keep best values.
 * Always shows something — never zeros out.
 */
export async function mergeProgressOnSignIn(): Promise<UserProgress> {
  const local = loadProgress();
  const cloud = await loadCloudProgress();

  if (!cloud) {
    // Cloud has no row or user not logged in — just use local
    // (trigger should have created the row; try uploading local data)
    await saveCloudProgress(local).catch(() => {});
    return local;
  }

  // Merge: take the union of mastered/review IDs, and max numeric values
  const merged: UserProgress = {
    masteredIds: Array.from(new Set([...local.masteredIds, ...cloud.masteredIds])),
    reviewIds: Array.from(new Set([...local.reviewIds, ...cloud.reviewIds])),
    sessionScore: Math.max(local.sessionScore, cloud.sessionScore),
    lives: Math.min(local.lives, cloud.lives),
    totalSeen: Math.max(local.totalSeen, cloud.totalSeen),
  };

  // Save merged result to both localStorage and cloud
  saveProgress(merged);
  await saveCloudProgress(merged).catch(() => {});

  return merged;
}
