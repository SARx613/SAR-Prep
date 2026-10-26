/* Locally stored essays (offline-first, like attempts). */

export interface Essay {
  id: string;
  ts: number;
  claim: string;
  instruction: string;
  text: string;
  seconds: number;
  /** 0–6 in half-point steps, from the learner's own rubric check. */
  selfScore?: number;
  /** Optional AI estimate. */
  ai?: { score: number; summary: string; improvements: string[] };
}

export const ESSAYS_KEY = 'sar-essays-v1';
const NONE: Essay[] = [];

export function parseEssays(raw: string | null): Essay[] {
  if (!raw) return NONE;
  try { const v = JSON.parse(raw); return Array.isArray(v) ? (v as Essay[]) : NONE; } catch { return NONE; }
}

export function saveEssay(e: Essay): void {
  try {
    const all = parseEssays(localStorage.getItem(ESSAYS_KEY)).filter((x) => x.id !== e.id);
    localStorage.setItem(ESSAYS_KEY, JSON.stringify([e, ...all].slice(0, 100)));
    window.dispatchEvent(new Event('gre-prep:storage'));
  } catch { /* storage blocked */ }
}

export const wordCount = (t: string) => (t.trim() ? t.trim().split(/\s+/).length : 0);
