/* Per-device preferences, kept in localStorage (read through useLocalValue). */

export const THEME_KEY = 'sar-theme';
export const TRANSLATION_KEY = 'sar-show-translation';
export const EXAM_DATE_KEY = 'sar-exam-date';
export const WEEKLY_HOURS_KEY = 'sar-weekly-hours';
export const REASONS_KEY = 'sar-error-reasons';

export type Theme = 'system' | 'light' | 'dark';

export const parseTheme = (raw: string | null): Theme => (raw === 'light' || raw === 'dark' ? raw : 'system');
export const parseFlag = (raw: string | null): boolean => raw === '1';
export const parseString = (raw: string | null): string => raw ?? '';
export const parseNumber = (raw: string | null): number => (raw && Number.isFinite(Number(raw)) ? Number(raw) : 0);

export type ErrorReason = 'concept' | 'careless' | 'misread' | 'time' | 'guess';
export const REASON_LABEL: Record<ErrorReason, string> = {
  concept: 'Did not know the concept',
  careless: 'Careless slip',
  misread: 'Misread the question',
  time: 'Ran out of time',
  guess: 'Guessed',
};

const NO_REASONS: Record<string, ErrorReason> = {};
export function parseReasons(raw: string | null): Record<string, ErrorReason> {
  if (!raw) return NO_REASONS;
  try {
    return JSON.parse(raw) as Record<string, ErrorReason>;
  } catch {
    return NO_REASONS;
  }
}
export const emptyReasons = NO_REASONS;

export function writePref(key: string, value: string | null): void {
  try {
    if (value === null || value === '') localStorage.removeItem(key);
    else localStorage.setItem(key, value);
    window.dispatchEvent(new Event('gre-prep:storage'));
  } catch {
    /* blocked storage: the setting just won't persist */
  }
}

export function applyTheme(t: Theme): void {
  const el = document.documentElement;
  if (t === 'system') el.removeAttribute('data-theme');
  else el.setAttribute('data-theme', t);
}

export function setReason(qid: string, reason: ErrorReason | null): void {
  try {
    const cur = parseReasons(localStorage.getItem(REASONS_KEY));
    const next = { ...cur };
    if (reason) next[qid] = reason; else delete next[qid];
    localStorage.setItem(REASONS_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('gre-prep:storage'));
  } catch {
    /* ignore */
  }
}
