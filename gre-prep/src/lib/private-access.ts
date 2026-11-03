import { auth } from '@/auth';
import { readPrivateJson } from '@/lib/private-content';

/* Who may open the private study material (ETS's own tests and exercises).
 * Closed by default: either the server runs in owner mode
 * (PRIVATE_STUDY_OPEN=1, for a local `next dev` / `next start`), or the
 * signed-in Google account is on the allow-list: PRIVATE_STUDY_EMAILS
 * (comma-separated) and/or private/allowed-emails.json ({"emails": [...]}),
 * which lives in the private repository and so never appears in the public one. */

export async function hasPrivateAccess(): Promise<boolean> {
  if (process.env.PRIVATE_STUDY_OPEN === '1') return true;
  const allowed = [
    ...(process.env.PRIVATE_STUDY_EMAILS ?? '').split(','),
    ...(readPrivateJson<{ emails: string[] }>('allowed-emails.json')?.emails ?? []),
  ]
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
