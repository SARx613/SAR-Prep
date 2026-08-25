import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Word, GameState, UserProgress, GameMode, SeriesResult } from '../types';
import { loadProgress, saveProgress, getQueue, getRandomOptions, normalizeAnswer, shuffleArray } from '../lib/storage';
import { saveProgress as saveCloudProgress } from '../app/actions/progress';

export type PlayMode = 'mcq' | 'typing' | 'flashcard' | 'mix';

export function useGameLoop(
  words: Word[],
  playMode: PlayMode = 'mix',
  /**
   * Restricts the run to these deck words, once through, then stops — a
   * series. Left out, the loop behaves as before: the whole deck, refilled
   * forever, which is the endless mode a series is meant to replace.
   */
  sessionWordIds?: number[],
) {
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

  // ── Session bookkeeping (series runs only) ───────────────────────────────
  // Only the first answer to a word counts for the score: a word you got on
  // the second pass was still a word you did not know.
  const firstTry = useRef<Map<number, boolean>>(new Map());
  const retried = useRef<Set<number>>(new Set());
  const [answeredCount, setAnsweredCount] = useState(0);
  const [done, setDone] = useState(false);
  /** The words of the run in progress — the whole series, or just the misses
   *  when the run is a replay of them. The recap scores against this. */
  const [runWords, setRunWords] = useState<Word[]>([]);

  const isSession = sessionWordIds !== undefined;
  // Identity of the run, so a replay of the same series restarts it and a
  // parent re-render with an equal array does not.
  const sessionKey = sessionWordIds?.join(',') ?? '';

  const sessionWords = useMemo(() => {
    if (!sessionWordIds) return null;
    const byId = new Map(words.map(w => [w.id, w]));
    return sessionWordIds
      .map(id => byId.get(id))
      .filter((w): w is Word => w !== undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, sessionKey]);

  const nextQuestion = useCallback((currentQueue: Word[]) => {
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

  const start = useCallback((deck: Word[]) => {
    firstTry.current = new Map();
    retried.current = new Set();
    setAnsweredCount(0);
    setDone(false);
    setState(prev => ({ ...prev, streak: 0 }));
    setRunWords(deck);
    setQueue(deck);
    nextQuestion(deck);
  }, [nextQuestion]);

  // Init: load from localStorage immediately
  useEffect(() => {
    if (words.length === 0) return;
    const p = loadProgress();
    setProgress(p);
    start(sessionWords ? shuffleArray(sessionWords) : getQueue(words, p));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [words, sessionWords]);

  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On every progress change: localStorage right away, cloud shortly after.
  useEffect(() => {
    if (!progress) return;

    // 1. localStorage — instant, and the source of truth when offline.
    saveProgress(progress);

    // 2. Cloud — debounced. Every answer used to fire its own request; as a
    //    Server Action that is a round trip per keystroke-speed answer, so
    //    coalesce bursts into one write. The action no-ops when signed out.
    if (cloudTimer.current) clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(() => {
      saveCloudProgress(progress).catch(() => {
        // Offline or signed out — localStorage already holds the truth.
      });
    }, 1200);

    return () => {
      if (cloudTimer.current) clearTimeout(cloudTimer.current);
    };
  }, [progress]);

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

    if (!firstTry.current.has(state.currentWord.id)) {
      firstTry.current.set(state.currentWord.id, isCorrect);
      setAnsweredCount(firstTry.current.size);
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
    // The finished card animates out while still on screen, so a second click
    // on "Continuer" can land before the new one mounts. Without this guard
    // that second call advances the queue again and the word is never asked —
    // which in a series shows up as a run that ends short.
    if (!progress || queue.length === 0 || !state.answered) return;
    const newQueue = [...queue];
    const finishedWord = newQueue.shift();

    if (isSession) {
      // A missed word comes back once more before the series ends, so the
      // run finishes on the words that need the work. Once only: a second
      // chance is repetition, an unlimited one is the endless list again.
      if (state.isCorrect === false && finishedWord && !retried.current.has(finishedWord.id)) {
        retried.current.add(finishedWord.id);
        newQueue.push(finishedWord);
      }
      setQueue(newQueue);
      if (newQueue.length === 0) setDone(true);
      else nextQuestion(newQueue);
      return;
    }

    if (state.isCorrect === false && finishedWord) {
      newQueue.splice(Math.min(5, newQueue.length), 0, finishedWord);
    }
    const refilled = newQueue.length === 0 ? getQueue(words, progress) : newQueue;
    setQueue(refilled);
    nextQuestion(refilled);
  }, [progress, queue, state.answered, state.isCorrect, words, nextQuestion, isSession]);

  /** Switches the card on screen to another mode. Tapping "QCM" should
   *  change the question in front of you, not only the one after it — as
   *  long as it has not been answered yet. */
  const setQuestionMode = useCallback((next: PlayMode) => {
    setState(prev => {
      if (!prev.currentWord || prev.answered) return prev;
      const mode: GameMode = next === 'mix'
        ? (Math.random() > 0.4 ? 'mcq' : 'typing')
        : (next as GameMode);
      return {
        ...prev,
        mode,
        options: mode === 'mcq' ? getRandomOptions(words, prev.currentWord) : [],
      };
    });
  }, [words]);

  const flipCard = useCallback(() => {
    if (state.mode === 'flashcard' && !state.flipped) {
      setState(prev => ({ ...prev, flipped: true }));
    }
  }, [state.mode, state.flipped]);

  /** Replays the session — the same words, or a subset such as the misses. */
  const restart = useCallback((wordIds?: number[]) => {
    const source = sessionWords ?? words;
    const deck = wordIds
      ? wordIds
        .map(id => source.find(w => w.id === id))
        .filter((w): w is Word => w !== undefined)
      : source;
    start(shuffleArray(deck));
  }, [sessionWords, words, start]);

  const result: SeriesResult | null = useMemo(() => {
    if (!isSession) return null;
    const correct = Array.from(firstTry.current.values()).filter(Boolean).length;
    const missed = runWords.filter(w => firstTry.current.get(w.id) === false);
    return { total: runWords.length, correct, missed };
    // firstTry is a ref, so `done` and `answeredCount` are what tell the
    // recap the map has changed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSession, runWords, done, answeredCount]);

  return {
    progress,
    state,
    queueSize: queue.length,
    handleAnswer,
    nextTurn,
    flipCard,
    setQuestionMode,
    /** Session only: the run is over and `result` holds the score. */
    done,
    result,
    /** Session only: words answered at least once, for the progress bar. */
    answeredCount,
    restart,
  };
}
