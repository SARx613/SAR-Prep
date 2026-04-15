export interface Word {
  id: number;
  word: string;
  definition: string;
  synonyms?: string[];
  french: string;
}

export type GameMode = 'mcq' | 'typing' | 'flashcard';

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
