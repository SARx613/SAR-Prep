import { createClient } from '@/utils/supabase/client';
import { UserProgress } from '@/types';
import { loadProgress, saveProgress } from './storage';

/** Fetch the current authenticated user (or null) */
export async function getCurrentUser() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** Load progress from Supabase for the current user */
export async function loadCloudProgress(): Promise<UserProgress | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('users_progress')
    .select('*')
    .eq('user_id', user.id)
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

/** Save / upsert progress to Supabase — silently fails if not authenticated */
export async function saveCloudProgress(progress: UserProgress): Promise<void> {
  const supabase = createClient();
  // Using getSession is fast and local, compared to getUser which hits the API
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return;

  const { error } = await supabase.from('users_progress').upsert(
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
  );
  if (error) alert("Supabase DB Save Error: " + error.message);
}

/**
 * Trigger Google OAuth sign-in.
 * Stores local progress in sessionStorage so we can merge after redirect.
 */
export async function signInWithGoogle(localProgress?: UserProgress): Promise<void> {
  const supabase = createClient();

  // Persist local progress across the OAuth redirect
  if (localProgress && (localProgress.masteredIds.length > 0 || localProgress.totalSeen > 0)) {
    sessionStorage.setItem('pending-local-progress', JSON.stringify(localProgress));
  }

  await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
}

/** Sign out the current user */
export async function signOut(): Promise<void> {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) alert("Signout DB Error: " + error.message);
  } catch (err: any) {
    alert("Signout Fatal Error: " + err.message);
  }
}

/**
 * Called after a SIGNED_IN event.
 * - If cloud progress exists → use it (cloud is authoritative)
 * - If not → upload the pending local progress
 * Returns the resolved progress to set as state.
 */
export async function mergeProgressOnSignIn(): Promise<UserProgress | null> {
  const cloudProgress = await loadCloudProgress();
  const localProgress = loadProgress();

  const pendingRaw = sessionStorage.getItem('pending-local-progress');
  sessionStorage.removeItem('pending-local-progress');

  if (cloudProgress) {
    // True Merge Strategy: NEVER overwrite or lose data.
    // We combine exactly what the user has done locally and in the cloud.
    const merged: UserProgress = {
      masteredIds: Array.from(new Set([...(localProgress?.masteredIds || []), ...cloudProgress.masteredIds])),
      reviewIds: Array.from(new Set([...(localProgress?.reviewIds || []), ...cloudProgress.reviewIds])),
      sessionScore: Math.max(localProgress?.sessionScore || 0, cloudProgress.sessionScore),
      lives: Math.min(localProgress?.lives ?? 5, cloudProgress.lives),
      totalSeen: Math.max(localProgress?.totalSeen || 0, cloudProgress.totalSeen),
    };
    
    // Attempt to sync the mathematically perfect data back to the cloud
    await saveCloudProgress(merged).catch(() => {});
    
    // Always commit the perfect data to Local Storage
    saveProgress(merged);
    return merged;
  }

  // Cloud is completely empty! Let's populate it with the pending or local data.
  if (pendingRaw) {
    const local = JSON.parse(pendingRaw) as UserProgress;
    await saveCloudProgress(local);
    return local;
  }

  // Push existing local storage to the newly created empty cloud
  if (localProgress && localProgress.totalSeen > 0) {
    await saveCloudProgress(localProgress);
  }
  
  return localProgress;
}
