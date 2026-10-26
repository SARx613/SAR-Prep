'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Calculator as CalcIcon, Check, Clock, Eye, EyeOff, LayoutGrid, X } from 'lucide-react';
import { grade as gradeQuestion, type Grade } from '@/lib/grading';
import { recordAttempts, type Attempt } from '@/lib/attempts';
import type { ClientQuestion } from '@/content/types';
import { Calculator } from './Calculator';
import { Feedback } from './Feedback';
import { Figure } from './Figure';
import { PassagePane } from './PassagePane';
import { QuestionPane } from './QuestionPane';
import { emptySelection, formatOf, hasAnswer, numericFormat, toResponse, type Selection } from './selection';

/* The exam player (PLAN §6.1): a plain, always-light screen that behaves like
 * the real test — Mark, Review, Back/Next, a timer you can hide, the
 * calculator on Quant — plus two ways to use it:
 *
 *   tutor  check each answer as you go and read the explanation
 *   timed  answer freely, review, finish, then see everything graded
 *
 * Grading is client-side (lib/grading.ts) so it works offline. */

export interface PlayerResult {
  q: ClientQuestion;
  sel: Selection;
  grade: Grade;
  ms: number;
}

interface Props {
  title: string;
  questions: ClientQuestion[];
  mode: 'tutor' | 'timed';
  /** Timed mode: seconds for the whole set. */
  timeLimitSec?: number;
  backHref: string;
  /** Force the calculator on/off; default: on when the set contains Quant. */
  calculator?: boolean;
  /** Where "Retry missed" goes, if the caller supports it. */
  onRetryMissed?: (ids: string[]) => void;
  onComplete?: (results: PlayerResult[]) => void;
  attemptMode?: Attempt['mode'];
  /** sessionStorage key to survive a reload. */
  storageKey?: string;
}

const fmtClock = (s: number) => {
  const m = Math.floor(Math.max(0, s) / 60), r = Math.max(0, s) % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

interface Saved { idx: number; sels: Record<string, Selection>; marked: string[]; elapsed: number; graded: Record<string, { grade: Grade; ms: number }> }

export function ExamPlayer({ title, questions, mode, timeLimitSec, backHref, calculator, onRetryMissed, onComplete, attemptMode, storageKey }: Props) {
  const [idx, setIdx] = useState(0);
  const [sels, setSels] = useState<Record<string, Selection>>({});
  const [marked, setMarked] = useState<Set<string>>(new Set());
  const [graded, setGraded] = useState<Record<string, { grade: Grade; ms: number }>>({});
  const [view, setView] = useState<'question' | 'review' | 'results'>('question');
  const [reviewing, setReviewing] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [showTimer, setShowTimer] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [tab, setTab] = useState<'stim' | 'q'>('q');
  const [confirmExit, setConfirmExit] = useState(false);
  const [results, setResults] = useState<PlayerResult[] | null>(null);

  const spent = useRef<Record<string, number>>({});
  const enteredAt = useRef(0);
  const restored = useRef(false);

  const q = questions[idx];
  const sel = sels[q.id] ?? emptySelection(q);
  const calcAllowed = calculator ?? questions.some((x) => x.section === 'quant');
  const isQuant = q.section === 'quant';
  const done = view === 'results';
  const tutorGraded = mode === 'tutor' ? graded[q.id] : undefined;
  const locked = !!tutorGraded || (done && reviewing);
  const shownGrade: Grade | null = done ? results?.find((r) => r.q.id === q.id)?.grade ?? null : tutorGraded?.grade ?? null;

  /* ── Timing ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    enteredAt.current = Date.now();
  }, [idx, view]);

  const bank = useCallback(() => {
    const id = questions[idx].id;
    const now = Date.now();
    if (view === 'question' && !done) spent.current[id] = (spent.current[id] ?? 0) + (now - enteredAt.current);
    enteredAt.current = now;
  }, [idx, questions, view, done]);

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [done]);

  /* ── Reload survival ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!storageKey || restored.current) return;
    restored.current = true;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return;
      const s = JSON.parse(raw) as Saved;
      /* eslint-disable react-hooks/set-state-in-effect */
      setIdx(Math.min(s.idx, questions.length - 1));
      setSels(s.sels);
      setMarked(new Set(s.marked));
      setElapsed(s.elapsed);
      setGraded(s.graded);
      /* eslint-enable react-hooks/set-state-in-effect */
    } catch { /* corrupt or blocked: start fresh */ }
  }, [storageKey, questions.length]);

  useEffect(() => {
    if (!storageKey || !restored.current || done) return;
    try {
      const s: Saved = { idx, sels, marked: [...marked], elapsed, graded };
      sessionStorage.setItem(storageKey, JSON.stringify(s));
    } catch { /* ignore */ }
  }, [storageKey, idx, sels, marked, elapsed, graded, done]);

  /* ── Actions ──────────────────────────────────────────────────────────── */
  const setSel = useCallback((next: Selection) => setSels((p) => ({ ...p, [questions[idx].id]: next })), [idx, questions]);

  const go = useCallback((to: number) => {
    bank();
    const target = Math.max(0, Math.min(questions.length - 1, to));
    setIdx(target);
    setView('question');
    const nq = questions[target];
    setTab(nq.type === 'RC' && formatOf(nq) === 'select_in_passage' ? 'stim' : 'q');
  }, [bank, questions]);

  const finish = useCallback(() => {
    bank();
    const out: PlayerResult[] = questions.map((qq) => {
      const s = sels[qq.id] ?? emptySelection(qq);
      const prior = graded[qq.id];
      const g = prior?.grade ?? gradeQuestion(qq, toResponse(qq, s));
      return { q: qq, sel: s, grade: g, ms: spent.current[qq.id] ?? prior?.ms ?? 0 };
    });
    const answered = out.filter((r) => !r.grade.incomplete);
    recordAttempts(
      answered.map((r) => ({
        qid: r.q.id, lessonId: r.q.lessonId, type: r.q.type, difficulty: r.q.difficulty,
        correct: r.grade.isCorrect, ms: r.ms, ts: Date.now(), mode: attemptMode ?? mode,
      })),
    );
    if (storageKey) try { sessionStorage.removeItem(storageKey); } catch { /* ignore */ }
    setResults(out);
    setView('results');
    setReviewing(false);
    onComplete?.(out);
  }, [bank, questions, sels, graded, attemptMode, mode, storageKey, onComplete]);

  // Time's up in timed mode ends the section, as on the real test.
  const remaining = mode === 'timed' && timeLimitSec ? timeLimitSec - elapsed : null;
  useEffect(() => {
    if (remaining !== null && remaining <= 0 && !done) finish();
  }, [remaining, done, finish]);

  const check = () => {
    bank();
    const g = gradeQuestion(q, toResponse(q, sel));
    const ms = spent.current[q.id] ?? 0;
    setGraded((p) => ({ ...p, [q.id]: { grade: g, ms } }));
  };

  const toggleMark = () =>
    setMarked((p) => {
      const n = new Set(p);
      if (n.has(q.id)) n.delete(q.id); else n.add(q.id);
      return n;
    });

  /* ── Keyboard: ← → move, M marks (never while typing) ─────────────────── */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea')) return;
      if (view !== 'question') return;
      if (e.key === 'ArrowRight') go(idx + 1);
      else if (e.key === 'ArrowLeft') go(idx - 1);
      else if ((e.key === 'm' || e.key === 'M') && !done) toggleMark();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const answeredCount = useMemo(() => questions.filter((x) => sels[x.id] && hasAnswer(x, sels[x.id])).length, [questions, sels]);
  const stimulus = q.passage ? 'passage' : q.figureSpec ? 'figure' : null;
  const last = idx === questions.length - 1;

  /* ── Results screen ───────────────────────────────────────────────────── */
  if (done && !reviewing && results) {
    const correct = results.filter((r) => r.grade.isCorrect).length;
    const missed = results.filter((r) => !r.grade.isCorrect);
    const totalMs = results.reduce((a, r) => a + r.ms, 0);
    return (
      <div className="exam min-h-dvh">
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
          <h1 className="text-2xl font-bold">{title} — results</h1>
          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            {[
              ['Correct', `${correct}/${results.length}`],
              ['Accuracy', `${Math.round((correct / results.length) * 100)}%`],
              ['Time', fmtClock(Math.round(totalMs / 1000))],
            ].map(([k, v]) => (
              <div key={k} className="rounded-[var(--radius)] border border-line bg-surface p-3">
                <p className="text-2xl font-extrabold tabular-nums">{v}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">{k}</p>
              </div>
            ))}
          </div>

          <ol className="mt-6 divide-y divide-line rounded-[var(--radius)] border border-line bg-surface">
            {results.map((r, i) => (
              <li key={r.q.id}>
                <button
                  type="button"
                  onClick={() => { setIdx(i); setReviewing(true); setView('question'); setTab('q'); }}
                  className="flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2"
                >
                  <span className="w-7 text-sm font-semibold text-muted">{i + 1}</span>
                  <span className={`grid h-6 w-6 place-items-center rounded-full text-white ${r.grade.isCorrect ? 'bg-good' : r.grade.incomplete ? 'bg-faint' : 'bg-bad'}`}>
                    {r.grade.isCorrect ? <Check size={14} /> : <X size={14} />}
                  </span>
                  <span className="flex-1 text-sm">{r.q.type} · difficulty {r.q.difficulty}{r.grade.incomplete ? ' · unanswered' : ''}</span>
                  <span className="text-xs tabular-nums text-muted">{Math.round(r.ms / 1000)}s / {r.q.estSeconds}s</span>
                </button>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={backHref} className="inline-flex h-11 items-center rounded-[var(--radius)] border border-line-strong bg-surface px-5 text-sm font-semibold">Done</Link>
            {missed.length > 0 && onRetryMissed && (
              <button type="button" onClick={() => onRetryMissed(missed.map((r) => r.q.id))} className="h-11 rounded-[var(--radius)] bg-accent px-5 text-sm font-semibold text-accent-fg">
                Retry {missed.length} missed
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ── Review grid (timed mode) ─────────────────────────────────────────── */
  if (view === 'review') {
    const unanswered = questions.length - answeredCount;
    return (
      <div className="exam min-h-dvh">
        <div className="mx-auto max-w-3xl px-4 pb-16 pt-6" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
          <h1 className="text-xl font-bold">Review</h1>
          <p className="mt-1 text-sm text-muted">
            {answeredCount} answered · {unanswered} not answered · {marked.size} marked.
            {remaining !== null && <> Time left {fmtClock(remaining)}.</>}
          </p>
          <ol className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-8">
            {questions.map((x, i) => {
              const a = sels[x.id] && hasAnswer(x, sels[x.id]);
              return (
                <li key={x.id}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-label={`Question ${i + 1}: ${a ? 'answered' : 'not answered'}${marked.has(x.id) ? ', marked' : ''}`}
                    className={`relative grid h-12 w-full place-items-center rounded-[var(--radius)] border text-sm font-semibold ${a ? 'border-accent bg-accent-soft text-accent' : 'border-line-strong bg-surface text-fg'}`}
                  >
                    {i + 1}
                    {marked.has(x.id) && <Bookmark size={12} className="absolute right-1 top-1 fill-current text-warn" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-6 flex flex-wrap gap-3">
            <button type="button" onClick={() => go(idx)} className="h-11 rounded-[var(--radius)] border border-line-strong bg-surface px-5 text-sm font-semibold">Return to questions</button>
            <button type="button" onClick={finish} className="h-11 rounded-[var(--radius)] bg-accent px-5 text-sm font-semibold text-accent-fg">
              {unanswered > 0 ? `Finish with ${unanswered} unanswered` : 'Finish section'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── The question screen ──────────────────────────────────────────────── */
  const stimulusNode = q.passage ? (
    <PassagePane
      passage={q.passage}
      selectable={q.type === 'RC' && formatOf(q) === 'select_in_passage'}
      paragraphIndex={(q.content as { paragraphIndex?: number }).paragraphIndex}
      selected={sel.sentence}
      onPick={(s) => setSel({ ...sel, sentence: s })}
      locked={locked}
      correctSentence={shownGrade && !shownGrade.isCorrect ? shownGrade.expected[0] : shownGrade?.isCorrect ? sel.sentence : undefined}
    />
  ) : q.figureSpec ? (
    <Figure spec={q.figureSpec} />
  ) : null;

  const canTransfer = calcAllowed && isQuant && numericFormat(q) && numericFormat(q) !== 'fraction' && !locked;
  const btn = 'inline-flex h-10 items-center gap-1.5 rounded-[var(--radius)] border border-line-strong bg-surface px-3 text-sm font-semibold hover:bg-surface-2 disabled:opacity-40';

  return (
    <div className="exam flex h-dvh flex-col">
      <header className="shrink-0 border-b border-line-strong bg-surface" style={{ paddingTop: 'var(--sat)', paddingLeft: 'var(--sal)', paddingRight: 'var(--sar)' }}>
        <div className="flex flex-wrap items-center gap-2 px-3 py-2">
          {Object.keys(sels).length > 0 && !done ? (
            <button type="button" onClick={() => setConfirmExit(true)} aria-label="Exit" className={btn}>
              <ArrowLeft size={16} aria-hidden /><span className="hidden sm:inline">Exit</span>
            </button>
          ) : (
            <Link href={backHref} className={btn} aria-label="Exit"><ArrowLeft size={16} aria-hidden /><span className="hidden sm:inline">Exit</span></Link>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold">{title}</p>
            <p className="text-xs text-muted">Question {idx + 1} of {questions.length}{done ? ' · review' : ''}</p>
          </div>

          {!done && (
            <div className="flex items-center gap-1.5">
              {showTimer ? (
                <span role="timer" className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius)] border border-line px-2.5 text-sm font-semibold tabular-nums">
                  <Clock size={15} aria-hidden /> {fmtClock(remaining !== null ? remaining : elapsed)}
                </span>
              ) : null}
              <button type="button" onClick={() => setShowTimer((v) => !v)} aria-label={showTimer ? 'Hide timer' : 'Show timer'} className={btn}>
                {showTimer ? <EyeOff size={16} /> : <Eye size={16} />}<span className="hidden md:inline">{showTimer ? 'Hide time' : 'Show time'}</span>
              </button>
            </div>
          )}

          <div className="flex items-center gap-1.5">
            {calcAllowed && isQuant && !done && (
              <button type="button" onClick={() => setCalcOpen((v) => !v)} aria-pressed={calcOpen} className={btn}>
                <CalcIcon size={16} aria-hidden /><span className="hidden md:inline">Calculator</span>
              </button>
            )}
            {!done && (
              <button type="button" onClick={toggleMark} aria-pressed={marked.has(q.id)} className={`${btn} ${marked.has(q.id) ? '!border-warn !bg-warn-soft' : ''}`}>
                <Bookmark size={16} className={marked.has(q.id) ? 'fill-current text-warn' : ''} aria-hidden /><span className="hidden md:inline">Mark</span>
              </button>
            )}
            {mode === 'timed' && !done && (
              <button type="button" onClick={() => { bank(); setView('review'); }} className={btn}>
                <LayoutGrid size={16} aria-hidden /><span className="hidden md:inline">Review</span>
              </button>
            )}
            {done && (
              <button type="button" onClick={() => setReviewing(false)} className={btn}>All results</button>
            )}
          </div>
        </div>
        {/* Progress rail */}
        <div className="h-1 bg-surface-2"><div className="h-full bg-accent transition-all" style={{ width: `${((idx + 1) / questions.length) * 100}%` }} /></div>
      </header>

      {confirmExit && (
        <div role="alertdialog" aria-label="Leave this set?" className="fixed inset-0 z-[60] grid place-items-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg border border-line-strong bg-surface p-5">
            <p className="font-semibold">Leave this set?</p>
            <p className="mt-1 text-sm text-muted">Your answers so far are not graded or saved.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmExit(false)} className={btn}>Stay</button>
              <Link href={backHref} onClick={() => { if (storageKey) try { sessionStorage.removeItem(storageKey); } catch { /* ignore */ } }} className="inline-flex h-10 items-center rounded-[var(--radius)] bg-bad px-4 text-sm font-semibold text-white">Leave</Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile: Passage/Figure ⇄ Question tabs */}
      {stimulus && (
        <div role="tablist" className="grid shrink-0 grid-cols-2 border-b border-line bg-surface lg:hidden">
          {([['stim', stimulus === 'passage' ? 'Passage' : 'Figure'], ['q', 'Question']] as const).map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`h-11 text-sm font-semibold ${tab === k ? 'border-b-2 border-accent text-accent' : 'text-muted'}`}>{label}</button>
          ))}
        </div>
      )}

      <main className={`min-h-0 flex-1 ${stimulus ? 'lg:grid lg:grid-cols-2' : ''}`}>
        {stimulus && (
          <section className={`h-full overflow-y-auto border-line p-4 sm:p-6 lg:border-r ${tab === 'stim' ? 'block' : 'hidden'} lg:block`} aria-label={stimulus === 'passage' ? 'Passage' : 'Figure'}>
            {stimulusNode}
          </section>
        )}
        <section className={`h-full overflow-y-auto p-4 sm:p-6 ${stimulus && tab === 'stim' ? 'hidden lg:block' : 'block'}`} aria-label="Question">
          <div className={stimulus ? 'mx-auto max-w-2xl' : 'mx-auto max-w-3xl'}>
            <QuestionPane
              key={q.id}
              q={q}
              sel={sel}
              onChange={setSel}
              locked={locked}
              grade={shownGrade}
              showLetters={!!shownGrade}
            />
            {shownGrade && (
              <div className="mt-6">
                <Feedback q={q} grade={shownGrade} ms={tutorGraded?.ms ?? results?.find((r) => r.q.id === q.id)?.ms} />
              </div>
            )}
          </div>
        </section>
      </main>

      <footer className="shrink-0 border-t border-line-strong bg-surface" style={{ paddingBottom: 'var(--sab)', paddingLeft: 'var(--sal)', paddingRight: 'var(--sar)' }}>
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-2.5">
          <button type="button" onClick={() => go(idx - 1)} disabled={idx === 0} className={btn}><ArrowLeft size={16} aria-hidden /> Back</button>
          <div className="flex-1 text-center text-xs text-muted tabular-nums">{answeredCount}/{questions.length} answered</div>
          {mode === 'tutor' && !done && !tutorGraded ? (
            <button type="button" onClick={check} disabled={!hasAnswer(q, sel)} className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius)] bg-accent px-5 text-sm font-bold text-accent-fg disabled:opacity-40">
              Check answer
            </button>
          ) : last && !done ? (
            <button type="button" onClick={() => (mode === 'timed' ? (bank(), setView('review')) : finish())} className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius)] bg-accent px-5 text-sm font-bold text-accent-fg">
              {mode === 'timed' ? 'Review' : 'Finish'}
            </button>
          ) : (
            <button type="button" onClick={() => go(idx + 1)} disabled={last} className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius)] bg-accent px-5 text-sm font-bold text-accent-fg disabled:opacity-40">
              Next <ArrowRight size={16} aria-hidden />
            </button>
          )}
        </div>
      </footer>

      {calcOpen && calcAllowed && isQuant && !done && (
        <Calculator
          onClose={() => setCalcOpen(false)}
          onTransfer={canTransfer ? (v) => setSel({ ...sel, numeric: v.replace(/^-0$/, '0') }) : undefined}
        />
      )}
    </div>
  );
}
