export interface Word {
  id: number;
  word: string;
  definition: string;
  synonyms?: string[];
  french: string;
}

export type GameMode = 'mcq' | 'typing' | 'flashcard';

/** A short, fixed set of deck words — one study session.
 *
 * The deck is far too long to work through in one run, so it is cut into
 * themed series of ~20 words that can be finished, scored and replayed. */
export interface WordSeries {
  id: string;
  /** Key into THEME_LABEL — the meaning the words share. */
  themeId: string;
  title: string;
  wordIds: number[];
}

/** How a finished series went, used for the recap screen. */
export interface SeriesResult {
  /** Words in the series. */
  total: number;
  /** Words answered right on the first try. */
  correct: number;
  /** Words missed on the first try, in the order they came up. */
  missed: Word[];
}

/** Per-series history, kept locally so replaying a series shows progress. */
export interface SeriesStat {
  /** Completed runs. */
  rounds: number;
  /** Best first-try score of any run. */
  bestScore: number;
  /** Most recent first-try score. */
  lastScore: number;
  /** Epoch ms of the last completed run. */
  lastPlayed: number;
}

export interface UserProgress {
  masteredIds: number[];
  reviewIds: number[];
  sessionScore: number;
  lives: number;
  totalSeen: number;
}

export interface GameState {
  currentWord: Word | null;
  options: Word[];
  mode: GameMode;
  answered: boolean;
  isCorrect: boolean | null;
  flipped: boolean;
  streak: number;
}
