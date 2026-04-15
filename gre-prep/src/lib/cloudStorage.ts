import { createClient } from '@/utils/supabase/client';
import { UserProgress } from '@/types';
import { loadProgress, saveProgress } from './storage';

/** Get current authenticated user — validates token with the server */
export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) console.warn('[Auth] getUser error:', error.message);
  return user ?? null;
}

/** Load progress row from Supabase for the current user */
export async function loadCloudProgress(): Promise<UserProgress | null> {
  const user = await getCurrentUser();
  if (!user) {
    console.log('[Cloud] Not authenticated — skipping cloud load');
    return null;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('users_progress')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error) {
    console.warn('[Cloud] Load error:', error.message, error.code);
    return null;
  }

  console.log('[Cloud] Loaded from Supabase:', data);
  return {
    masteredIds: data.mastered_ids ?? [],
    reviewIds: data.review_ids ?? [],
    sessionScore: data.session_score ?? 0,
    lives: data.lives ?? 5,
    totalSeen: data.total_seen ?? 0,
  };
}

/** Save progress to Supabase — logs every error */
export async function saveCloudProgress(progress: UserProgress): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    console.log('[Cloud] Not authenticated — skipping cloud save');
    return;
  }

  console.log('[Cloud] Saving to Supabase for user:', user.id, progress);

  const supabase = createClient();
  const { data, error } = await supabase.from('users_progress').upsert(
    {
      user_id: user.id,
      mastered_ids: progress.masteredIds,
      review_ids: progress.reviewIds,
      session_score: progress.sessionScore,
      lives: progress.lives,
      total_seen: progress.totalSeen,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  ).select();

  if (error) {
    console.error('[Cloud] Save FAILED:', error.message, '| code:', error.code, '| details:', error.details);
  } else {
    console.log('[Cloud] Save SUCCESS:', data);
  }
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
 */
export async function mergeProgressOnSignIn(): Promise<UserProgress> {
  const local = loadProgress();
  const cloud = await loadCloudProgress();

  if (!cloud) {
    console.log('[Merge] No cloud data — using local and uploading it');
    await saveCloudProgress(local).catch(e => console.error('[Merge] Upload local failed:', e));
    return local;
  }

  // Merge: take union of IDs and max numeric values
  const merged: UserProgress = {
    masteredIds: Array.from(new Set([...local.masteredIds, ...cloud.masteredIds])),
    reviewIds: Array.from(new Set([...local.reviewIds, ...cloud.reviewIds])),
    sessionScore: Math.max(local.sessionScore, cloud.sessionScore),
    lives: Math.min(local.lives, cloud.lives),
    totalSeen: Math.max(local.totalSeen, cloud.totalSeen),
  };

  console.log('[Merge] Merged result:', merged);
  saveProgress(merged);
  await saveCloudProgress(merged).catch(e => console.error('[Merge] Save merged failed:', e));
  return merged;
}
