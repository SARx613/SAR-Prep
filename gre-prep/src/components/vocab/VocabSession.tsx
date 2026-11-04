'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, Lightbulb, Loader2, RotateCcw, Target, X } from 'lucide-react';
import type { Word } from '@/types';
import { useGameLoop, type PlayMode } from '@/hooks/useGameLoop';
import { useLocalValue } from '@/hooks/useLocalValue';
import { useShowTranslation } from '@/hooks/usePrefs';
import { defaultProgress, parseProgress, PROGRESS_KEY } from '@/lib/storage';
import { dailySeries, getSeries, nextSeries, recordSeriesRun, reviewSeries } from '@/lib/series';
import { NO_SRS, SRS_KEY, parseSrs } from '@/lib/word-srs';

const MODES: { id: PlayMode; label: string; hint: string }[] = [
  { id: 'adaptive', label: 'Adaptive', hint: 'Gets harder as you learn each word' },
  { id: 'cloze', label: 'Sentences', hint: 'Complete the sentence' },
  { id: 'mcq', label: 'Definitions', hint: 'Pick the word for a definition' },
  { id: 'typing', label: 'Typing', hint: 'Type the word' },
  { id: 'flashcard', label: 'Flashcards', hint: 'See the definition, recall the word' },
];
const MODE_KEY = 'gre-prep-play-mode';
const parseMode = (raw: string | null): PlayMode | null => (MODES.some((m) => m.id === raw) ? (raw as PlayMode) : null);

const card = 'rounded-[var(--radius)] border border-line bg-surface';
const primary = 'inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius)] bg-accent px-6 text-base font-bold text-accent-fg';
const secondary = 'inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius)] border border-line-strong bg-surface px-5 text-sm font-semibold hover:bg-surface-2';

/** The sentence with the target word blanked out; once answered the word is shown in its place. */
function Sentence({ text, word, revealed }: { text: string; word: string; revealed: boolean }) {
  const at = text.toLowerCase().indexOf(word.toLowerCase());
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      {revealed
        ? <mark className="rounded bg-good-soft px-1 font-bold text-good">{text.slice(at, at + word.length)}</mark>
        : <span role="img" aria-label="blank" className="mx-1 inline-block min-w-[6ch] border-b-2 border-accent align-baseline">&nbsp;</span>}
      {text.slice(at + word.length)}
    </>
  );
}

export function VocabSession({ seriesId }: { seriesId: string }) {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const showFrench = useShowTranslation();

  const savedMode = useLocalValue(MODE_KEY, parseMode, null);
  const [pickedMode, setPickedMode] = useState<PlayMode | null>(null);
  const mode: PlayMode = pickedMode ?? savedMode ?? 'adaptive';

  // "review" and "daily" are views of progress and of the schedule, snapshotted
  // when the session opens so that answering does not reshuffle the queue.
  const progressSnapshot = useLocalValue(PROGRESS_KEY, parseProgress, defaultProgress);
  const srsSnapshot = useLocalValue(SRS_KEY, parseSrs, NO_SRS);
  const [openedAt] = useState(() => Date.now());
  const series = useMemo(
    () => seriesId === 'review' ? reviewSeries(progressSnapshot)
      : seriesId === 'daily' ? dailySeries(srsSnapshot, openedAt)
      : getSeries(seriesId) ?? null,
    [seriesId, progressSnapshot, srsSnapshot, openedAt],
  );

  useEffect(() => {
    fetch('/words.json')
      .then((r) => r.json())
      .then((d: Word[]) => { setWords(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const wordIds = useMemo(() => series?.wordIds ?? [], [series]);
  const { progress, state, handleAnswer, nextTurn, flipCard, setQuestionMode, done, result, answeredCount, restart } =
    useGameLoop(words, mode, wordIds);

  // The option last chosen, so a wrong pick can be marked in red (click or key).
  const [picked, setPicked] = useState<string | null>(null);
  const answer = (a: string | boolean) => { if (typeof a === 'string') setPicked(a); handleAnswer(a); };

  const recorded = useRef(false);
  useEffect(() => {
    if (!done || !result || !series || series.id === 'review' || series.id === 'daily') return;
    if (result.total !== series.wordIds.length || recorded.current) return;
    recorded.current = true;
    recordSeriesRun(series.id, result.correct);
  }, [done, result, series]);

  const replay = (ids?: number[]) => { recorded.current = false; restart(ids); };
  const chooseMode = (m: PlayMode) => {
    setPickedMode(m);
    setQuestionMode(m);
    try { localStorage.setItem(MODE_KEY, m); } catch { /* private mode: holds for this session */ }
  };

  // Keyboard: 1–5 pick an option, Enter continues (or flips a flashcard).
  const { currentWord, mode: qMode, answered, options, flipped } = state;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (done || !currentWord || e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (!answered && (qMode === 'mcq' || qMode === 'cloze')) {
        const i = Number(e.key) - 1;
        if (i >= 0 && i < options.length) answer(options[i].word);
      } else if (qMode === 'flashcard' && !flipped && e.key === 'Enter') flipCard();
      else if (answered && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); nextTurn(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, currentWord, answered, qMode, options, flipped, handleAnswer, nextTurn, flipCard]);

  const shell = (children: React.ReactNode) => (
    <div className="mx-auto max-w-2xl px-4 pb-10 sm:px-6" style={{ paddingTop: 'calc(1.25rem + var(--sat))' }}>{children}</div>
  );

  if (loading) {
    return shell(<div className="flex min-h-[50vh] items-center justify-center text-accent-ink"><Loader2 className="animate-spin" size={36} aria-label="Loading" /></div>);
  }
  if (!series || series.wordIds.length === 0) {
    const msg = seriesId === 'review' ? ['Nothing to review', 'No missed words yet. Play a series and this list will fill up.']
      : seriesId === 'daily' ? ['Nothing for today', 'No reviews are due and every word has been started. Come back tomorrow.']
      : ['Series not found', 'This series does not exist (any more).'];
    return shell(
      <div className="py-16 text-center">
        <h1 className="text-2xl font-bold">{msg[0]}</h1>
        <p className="mx-auto mt-2 max-w-sm text-muted">{msg[1]}</p>
        <Link href="/flashcards" className={`${primary} mt-6`}>Back to vocabulary</Link>
      </div>,
    );
  }

  const total = result?.total ?? series.wordIds.length;
  const current = Math.min(answeredCount + (done ? 0 : 1), total);
  const upcoming = nextSeries(series.id);

  return shell(
    <>
      <header>
        <div className="flex items-center gap-3">
          <Link href="/flashcards" className="inline-flex min-h-[40px] items-center gap-1.5 text-sm font-semibold text-accent-ink hover:underline"><ArrowLeft size={14} aria-hidden /> Vocabulary</Link>
          <p className="min-w-0 flex-1 truncate text-right text-sm font-semibold">{series.title}</p>
          <p className="shrink-0 rounded-full bg-surface-2 px-3 py-1 text-sm font-bold tabular-nums">{current}<span className="font-medium text-muted"> / {total}</span></p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2" role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total}>
          <div className="h-full rounded-full bg-accent transition-[width] duration-300" style={{ width: `${total ? (answeredCount / total) * 100 : 0}%` }} />
        </div>
        {!done && (
          <div className="-mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist" aria-label="Question type">
            <div className="flex w-max gap-2">
              {MODES.map((m) => (
                <button key={m.id} role="tab" aria-selected={mode === m.id} title={m.hint} onClick={() => chooseMode(m.id)}
                  className={`min-h-[40px] rounded-full border px-4 text-sm font-semibold ${mode === m.id ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong bg-surface text-muted hover:text-fg'}`}>
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="mt-5">
        {done && result ? (
          <Recap result={result} showFrench={showFrench} onReplay={() => replay()} onReplayMissed={() => replay(result.missed.map((w) => w.id))}
            next={upcoming && series.id !== 'review' && series.id !== 'daily' ? { href: `/flashcards/${upcoming.id}`, title: upcoming.title } : null} />
        ) : progress && currentWord ? (
          <Question key={`${currentWord.id}-${qMode}`} state={state} showFrench={showFrench} picked={picked}
            onAnswer={answer} onNext={nextTurn} onFlip={flipCard} />
        ) : null}
      </main>
    </>,
  );
}

function Question({ state, showFrench, picked, onAnswer, onNext, onFlip }: {
  state: ReturnType<typeof useGameLoop>['state']; showFrench: boolean; picked: string | null;
  onAnswer: (a: string | boolean) => void; onNext: () => void; onFlip: () => void;
}) {
  const { currentWord: w, mode, answered, isCorrect, options, flipped } = state;
  const [typed, setTyped] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const after = useRef<HTMLDivElement>(null);
  useEffect(() => { if (mode === 'typing' && !answered) input.current?.focus(); }, [mode, answered]);
  // On a phone the feedback lands below the fold: bring it, and the Continue button, into view.
  useEffect(() => { if (answered) after.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [answered]);
  if (!w) return null;

  const cloze = mode === 'cloze' && w.example;
  const label = cloze ? 'Complete the sentence' : mode === 'flashcard' ? 'Recall the word' : mode === 'typing' ? 'Type the word' : 'Which word means…';

  return (
    <div>
      <div className={`${card} p-5 sm:p-7`}>
        <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-accent-ink"><Lightbulb size={14} aria-hidden />{label}</p>
        {cloze ? (
          <p className="mt-3 text-xl leading-relaxed sm:text-[22px]"><Sentence text={w.example!} word={w.word} revealed={answered} /></p>
        ) : (
          <p className="mt-3 text-xl font-semibold leading-snug sm:text-2xl">{w.definition}</p>
        )}

        {/* Options */}
        {(mode === 'mcq' || mode === 'cloze') && (
          <ul className="mt-5 grid gap-2.5" aria-label="Answers">
            {options.map((o, i) => {
              const isKey = o.id === w.id;
              const wrong = answered && !isKey && o.word === picked;
              const tone = !answered ? 'border-line-strong bg-surface hover:border-accent hover:bg-accent-soft'
                : isKey ? 'border-good bg-good-soft text-fg'
                : wrong ? 'border-bad bg-bad-soft text-fg'
                : 'border-line bg-surface opacity-60';
              return (
                <li key={o.id}>
                  <button disabled={answered} onClick={() => onAnswer(o.word)}
                    className={`flex min-h-[52px] w-full items-center gap-3 rounded-[var(--radius)] border px-4 py-2 text-left text-base font-semibold transition-colors ${tone}`}>
                    <span aria-hidden className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-2 text-xs font-bold text-muted">{i + 1}</span>
                    <span className="min-w-0 flex-1 break-words">{o.word}</span>
                    {answered && isKey && <Check size={18} className="shrink-0 text-good" aria-label="Correct" />}
                    {wrong && <X size={18} className="shrink-0 text-bad" aria-label="Your answer" />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Typing */}
        {mode === 'typing' && (
          <form className="mt-5" onSubmit={(e) => { e.preventDefault(); if (typed.trim() && !answered) onAnswer(typed); }}>
            <label className="sr-only" htmlFor="typed">Your answer</label>
            <input id="typed" ref={input} value={typed} onChange={(e) => setTyped(e.target.value)} disabled={answered}
              placeholder="Type the word…" autoComplete="off" autoCapitalize="off" spellCheck={false}
              className={`h-14 w-full rounded-[var(--radius)] border-2 bg-surface px-4 text-lg font-semibold outline-none focus:border-accent ${answered ? (isCorrect ? 'border-good' : 'border-bad') : 'border-line-strong'}`} />
            {!answered && <button type="submit" disabled={!typed.trim()} className={`${primary} mt-3 w-full disabled:opacity-40`}>Check</button>}
          </form>
        )}

        {/* Flashcard */}
        {mode === 'flashcard' && !answered && (
          <div className="mt-5">
            {!flipped ? (
              <button onClick={onFlip} className={`${secondary} w-full`}><Eye size={18} aria-hidden /> Show the word <span className="hidden text-xs font-normal text-muted sm:inline">(Enter)</span></button>
            ) : (
              <>
                <p className="text-center text-3xl font-extrabold tracking-tight">{w.word}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button onClick={() => onAnswer(false)} className={`${secondary} !border-bad/50 text-bad`}><X size={18} aria-hidden /> Didn’t know</button>
                  <button onClick={() => onAnswer(true)} className={primary}><Check size={18} aria-hidden /> Knew it</button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Feedback */}
      {answered && (
        <div ref={after} className="scroll-mb-24 lg:scroll-mb-4">
        <div className={`${card} mt-3 p-5 sm:p-6`} role="status">
          <p className={`flex items-center gap-2 font-bold ${isCorrect ? 'text-good' : 'text-bad'}`}>
            {isCorrect ? <Check size={18} aria-hidden /> : <X size={18} aria-hidden />}{isCorrect ? 'Correct' : 'Not quite'}
          </p>
          <p className="mt-2 text-lg"><strong className="font-extrabold">{w.word}</strong> <span className="text-muted">·</span> {w.definition}</p>
          {w.synonyms && w.synonyms.length > 0 && (
            <p className="mt-2 flex flex-wrap items-center gap-1.5 text-sm"><span className="text-muted">Synonyms:</span>
              {w.synonyms.slice(0, 4).map((s) => <span key={s} className="rounded-full bg-surface-2 px-2.5 py-0.5 font-medium">{s}</span>)}
            </p>
          )}
          {showFrench && <p className="mt-2 text-sm"><span className="text-muted">French:</span> <span className="font-semibold">{w.french}</span></p>}
          {w.example && !cloze && <p className="mt-3 border-l-2 border-line-strong pl-3 text-sm italic text-muted">{w.example}</p>}
          {w.trap && <p className="mt-3 rounded-[var(--radius)] bg-warn-soft px-3 py-2 text-sm text-warn"><strong>Watch out:</strong> {w.trap}</p>}
        </div>
        <div className="mt-4">
          <button onClick={onNext} autoFocus className={`${primary} w-full sm:ml-auto sm:flex sm:w-auto`}>Continue <ArrowRight size={18} aria-hidden /></button>
        </div>
        </div>
      )}
    </div>
  );
}

function Recap({ result, showFrench, onReplay, onReplayMissed, next }: {
  result: { total: number; correct: number; missed: Word[] }; showFrench: boolean;
  onReplay: () => void; onReplayMissed: () => void; next: { href: string; title: string } | null;
}) {
  const pct = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const perfect = result.missed.length === 0;
  const r = 44, c = 2 * Math.PI * r;
  return (
    <div className={`${card} p-5 sm:p-7`}>
      <div className="flex items-center gap-5">
        <svg width="104" height="104" viewBox="0 0 104 104" role="img" aria-label={`${pct} percent first try`} className="shrink-0">
          <circle cx="52" cy="52" r={r} fill="none" stroke="var(--line)" strokeWidth="9" />
          <circle cx="52" cy="52" r={r} fill="none" stroke={perfect ? 'var(--good)' : 'var(--accent)'} strokeWidth="9" strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 52 52)" />
          <text x="52" y="52" textAnchor="middle" dominantBaseline="central" className="fill-current text-fg" style={{ fontSize: 24, fontWeight: 800 }}>{pct}%</text>
        </svg>
        <div className="min-w-0">
          <h2 className="text-2xl font-extrabold tracking-tight">{perfect ? 'Perfect run' : 'Session complete'}</h2>
          <p className="mt-1 text-muted">{result.correct} of {result.total} right on the first try</p>
        </div>
      </div>

      {result.missed.length > 0 && (
        <section className="mt-6" aria-label="Words to rework">
          <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-bad"><Target size={14} aria-hidden /> To rework ({result.missed.length})</h3>
          <ul className="mt-3 space-y-2">
            {result.missed.map((w) => (
              <li key={w.id} className="rounded-[var(--radius)] bg-surface-2 px-4 py-3">
                <p className="flex flex-wrap items-baseline justify-between gap-x-3"><strong className="font-extrabold">{w.word}</strong>{showFrench && <span className="text-sm text-muted">{w.french}</span>}</p>
                <p className="mt-0.5 text-sm text-muted">{w.definition}</p>
                {w.trap && <p className="mt-1 text-sm text-warn">Watch out: {w.trap}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {result.missed.length > 0 && <button onClick={onReplayMissed} className={primary}><Target size={17} aria-hidden /> Replay the {result.missed.length} missed</button>}
        <button onClick={onReplay} className={result.missed.length > 0 ? secondary : primary}><RotateCcw size={17} aria-hidden /> Replay all</button>
        {next && <Link href={next.href} className={secondary}>Next: {next.title} <ArrowRight size={16} aria-hidden /></Link>}
        <Link href="/flashcards" className={secondary}>Back to vocabulary</Link>
      </div>
    </div>
  );
}
