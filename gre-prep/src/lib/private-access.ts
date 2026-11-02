import { auth } from '@/auth';

/* Who may open the private study material (ETS's own tests and exercises).
 * Closed by default: either the server runs in owner mode
 * (PRIVATE_STUDY_OPEN=1, for a local `next dev` / `next start`), or the
 * signed-in Google account is on PRIVATE_STUDY_EMAILS (comma-separated). */

export async function hasPrivateAccess(): Promise<boolean> {
  if (process.env.PRIVATE_STUDY_OPEN === '1') return true;
  const allowed = (process.env.PRIVATE_STUDY_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.length) return false;
  try {
    const email = (await auth())?.user?.email?.toLowerCase();
    return Boolean(email && allowed.includes(email));
  } catch {
    return false;
  }
}
