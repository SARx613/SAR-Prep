/* A practice session that survives closing the app: where you are in a set,
 * what you selected, the questions you checked and the clock. Kept in
 * localStorage (not sessionStorage, which dies with the tab) under a key per
 * set. Answers themselves are logged separately, the moment they are checked
 * (lib/attempts.ts), so this only restores the screen. */

const PREFIX = 'sar-session:';
const DAY = 24 * 60 * 60 * 1000;

export interface StoredSession<T> { v: 1; savedAt: number; data: T }

export function loadSession<T>(key: string, maxAgeMs: number): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const s = JSON.parse(raw) as StoredSession<T>;
    if (s.v !== 1 || Date.now() - s.savedAt > maxAgeMs) { localStorage.removeItem(PREFIX + key); return null; }
    return s.data;
  } catch {
    return null;
  }
}

export function saveSession<T>(key: string, data: T): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ v: 1, savedAt: Date.now(), data } satisfies StoredSession<T>));
  } catch { /* storage full or blocked: the answers are already logged, only the screen is not restored */ }
}

export function clearSession(key: string): void {
  try { localStorage.removeItem(PREFIX + key); } catch { /* ignore */ }
}

/** Drop old sessions so storage does not fill up with abandoned sets. */
export function pruneSessions(maxAgeMs = 30 * DAY): void {
  try {
    const keys = Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)).filter((k): k is string => !!k && k.startsWith(PREFIX));
    for (const k of keys) {
      try {
        const s = JSON.parse(localStorage.getItem(k) ?? '') as StoredSession<unknown>;
        if (s.v !== 1 || Date.now() - s.savedAt > maxAgeMs) localStorage.removeItem(k);
      } catch { localStorage.removeItem(k); }
    }
  } catch { /* ignore */ }
}

export const SESSION_TTL = { tutor: 30 * DAY, timed: DAY } as const;
