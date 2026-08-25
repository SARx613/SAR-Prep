import { Word, UserProgress } from '@/types';

export const PROGRESS_KEY = 'gre-prep-progress';

export const defaultProgress: UserProgress = {
  masteredIds: [],
  reviewIds: [],
  sessionScore: 0,
  lives: 5,
  totalSeen: 0,
};

/** Split out from loadProgress so a hook can parse a snapshot it already
 *  holds without touching storage again. */
export function parseProgress(raw: string | null): UserProgress {
  if (!raw) return defaultProgress;
  try {
    return { ...defaultProgress, ...JSON.parse(raw) };
  } catch {
    return defaultProgress;
  }
}

export function loadProgress(): UserProgress {
  if (typeof window === 'undefined') return defaultProgress;
  try {
    return parseProgress(localStorage.getItem(PROGRESS_KEY));
  } catch {
    return defaultProgress;
  }
}

export function saveProgress(progress: UserProgress): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
}

export function resetProgress(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PROGRESS_KEY);
}

export function getQueue(words: Word[], progress: UserProgress): Word[] {
  const mastered = new Set(progress.masteredIds);
  // Prioritize review words, then unseen words — both shuffled for random order
  const reviewWords = words.filter(w => progress.reviewIds.includes(w.id));
  const unseenWords = words.filter(w => !mastered.has(w.id) && !progress.reviewIds.includes(w.id));
  return [...shuffleArray(reviewWords), ...shuffleArray(unseenWords)];
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getRandomOptions(words: Word[], correct: Word, count = 4): Word[] {
  const others = words.filter(w => w.id !== correct.id);
  const distractors = shuffleArray(others).slice(0, count - 1);
  return shuffleArray([correct, ...distractors]);
}

export function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase().replace(/[-\s]+/g, ' ');
}
