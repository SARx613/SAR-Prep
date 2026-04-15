import { useState, useEffect, useCallback } from 'react';
import { Word, GameState, UserProgress, GameMode } from '../types';
import { loadProgress, saveProgress, getQueue, getRandomOptions, normalizeAnswer } from '../lib/storage';
import { saveCloudProgress, getCurrentUser } from '../lib/cloudStorage';

export type PlayMode = 'mcq' | 'typing' | 'flashcard' | 'mix';

export function useGameLoop(words: Word[], playMode: PlayMode = 'mix') {
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [queue, setQueue] = useState<Word[]>([]);
  const [state, setState] = useState<GameState>({
    currentWord: null,
    options: [],
    mode: 'mcq',
    answered: false,
    isCorrect: null,
    flipped: false,
    streak: 0,
  });

  // Init: always load from localStorage immediately
  useEffect(() => {
    if (words.length === 0) return;
    const p = loadProgress();
    setProgress(p);
    const q = getQueue(words, p);
    setQueue(q);
    nextQuestion(q, p);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words]);

  // Save to localStorage immediately on every change, and sync to cloud after 3s idle
  useEffect(() => {
    if (!progress) return;
    
    // Always save locally immediately — this is what the dashboard reads
    saveProgress(progress);

    // Try to push to cloud in background (non-blocking, 3 second debounce)
    const timer = setTimeout(() => {
      getCurrentUser().then(user => {
        if (user) saveCloudProgress(progress).catch(() => {});
      });
    }, 3000);

    return () => clearTimeout(timer);
  }, [progress]);

  const nextQuestion = useCallback((currentQueue: Word[], currentProgress: UserProgress) => {
    if (currentQueue.length === 0) return;

    const word = currentQueue[0];

    let mode: GameMode;
    if (playMode === 'mix') {
      mode = Math.random() > 0.4 ? 'mcq' : 'typing';
    } else {
      mode = playMode as GameMode;
    }

    setState(prev => ({
      ...prev,
      currentWord: word,
      options: mode === 'mcq' ? getRandomOptions(words, word) : [],
      mode,
      answered: false,
      isCorrect: null,
      flipped: false,
    }));
  }, [words, playMode]);

  const handleAnswer = useCallback((answer: string | boolean) => {
    if (!state.currentWord || state.answered || !progress) return;

    let isCorrect = false;

    if (state.mode === 'mcq' || state.mode === 'typing') {
      if (typeof answer === 'string') {
        isCorrect = normalizeAnswer(answer) === normalizeAnswer(state.currentWord.word);
      }
    } else if (state.mode === 'flashcard') {
      if (typeof answer === 'boolean') {
        isCorrect = answer;
      }
    }

    setState(prev => ({
      ...prev,
      answered: true,
      isCorrect,
      flipped: true,
      streak: isCorrect ? prev.streak + 1 : 0
    }));

    setProgress(prev => {
      if (!prev) return prev;
      const newMastered = new Set(prev.masteredIds);
      const newReview = new Set(prev.reviewIds);

      if (isCorrect) {
        newReview.delete(state.currentWord!.id);
        newMastered.add(state.currentWord!.id);
      } else {
        newMastered.delete(state.currentWord!.id);
        newReview.add(state.currentWord!.id);
      }

      return {
        ...prev,
        masteredIds: Array.from(newMastered),
        reviewIds: Array.from(newReview),
        sessionScore: prev.sessionScore + (isCorrect ? 10 : 0),
        lives: isCorrect ? prev.lives : Math.max(0, prev.lives - 1),
        totalSeen: prev.totalSeen + 1,
      };
    });
  }, [state, progress]);

  const nextTurn = useCallback(() => {
    if (!progress || queue.length === 0) return;

    let newQueue = [...queue];
    const finishedWord = newQueue.shift();

    if (state.isCorrect === false && finishedWord) {
      newQueue.splice(Math.min(5, newQueue.length), 0, finishedWord);
    }

    if (newQueue.length === 0) {
      newQueue = getQueue(words, progress);
    }

    setQueue(newQueue);
    nextQuestion(newQueue, progress);
  }, [progress, queue, state.isCorrect, words, nextQuestion]);

  const flipCard = useCallback(() => {
    if (state.mode === 'flashcard' && !state.flipped) {
      setState(prev => ({ ...prev, flipped: true }));
    }
  }, [state.mode, state.flipped]);

  return {
    progress,
    state,
    queueSize: queue.length,
    handleAnswer,
    nextTurn,
    flipCard
  };
}
