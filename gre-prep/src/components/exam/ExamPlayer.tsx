'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Calculator as CalcIcon, Check, Clock, Eye, EyeOff, LayoutGrid, X } from 'lucide-react';
import { grade as gradeQuestion, type Grade } from '@/lib/grading';
import { answeredBefore, readAttempts, recordAttempts, type Attempt } from '@/lib/attempts';
import { SESSION_TTL, clearSession, loadSession, pruneSessions, saveSession } from '@/lib/session';
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
  /** Key under which the session is kept on this device (survives closing the app). */
  storageKey?: string;
  /** Practice sets: open at the first question not answered before and show the earlier ones as done. */
  skipAnswered?: boolean;
  /** If it returns a URL the player navigates there instead of showing results (mock section 1 → 2). */
  afterFinish?: (results: PlayerResult[]) => string | null;
}

const fmtClock = (s: number) => {
  const m = Math.floor(Math.max(0, s) / 60), r = Math.max(0, s) % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

interface Saved { idx: number; sels: Record<string, Selection>; marked: string[]; elapsed: number; graded: Record<string, { grade: Grade; ms: number }> }

export function ExamPlayer({ title, questions, mode, timeLimitSec, backHref, calculator, onRetryMissed, onComplete, attemptMode, storageKey, afterFinish, skipAnswered }: Props) {
  const router = useRouter();
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
  const [resumeNote, setResumeNote] = useState<string | null>(null);

  const spent = useRef<Record<string, number>>({});
  const enteredAt = useRef(0);
  const restored = useRef(false);
  /** Set when the learner leaves on purpose, so the clock cannot write the session back. */
  const leaving = useRef(false);
  /** Questions already written to the attempt log, so finishing never counts one twice. */
  const recorded = useRef<Set<string>>(new Set());

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
    pruneSessions();
    /* eslint-disable react-hooks/set-state-in-effect */
    try {
      const s = loadSession<Saved>(storageKey, SESSION_TTL[mode]);
      if (s) {
        setIdx(Math.min(s.idx, questions.length - 1));
        setSels(s.sels);
        setMarked(new Set(s.marked));
        setElapsed(s.elapsed);
        setGraded(s.graded);
        // What was checked before the app closed is already in the attempt log.
        if (mode === 'tutor') for (const id of Object.keys(s.graded)) recorded.current.add(id);
        const n = Object.keys(s.graded).length;
        if (n > 0 && mode === 'tutor') setResumeNote(`Picking up where you left off: ${n} of ${questions.length} answered.`);
        return;
      }
      if (skipAnswered && mode === 'tutor') {
        // No saved screen (cleared storage, or another device): rebuild it from the answers on record.
        const before = answeredBefore(readAttempts(), questions.map((x) => x.id));
        const firstNew = questions.findIndex((x) => !before.has(x.id));
        if (before.size > 0 && firstNew > 0) {
          const g: Record<string, { grade: Grade; ms: number }> = {};
          for (const x of questions) {
            const ok = before.get(x.id);
            if (ok === undefined) continue;
            const expected = gradeQuestion(x, toResponse(x, emptySelection(x))).expected;
            g[x.id] = { grade: { isCorrect: ok, expected, incomplete: false }, ms: 0 };
            recorded.current.add(x.id);
          }
          setGraded(g);
          setIdx(firstNew);
          setResumeNote(`Picking up at question ${firstNew + 1}: ${before.size} of ${questions.length} already answered.`);
        }
      }
    } catch { /* corrupt or blocked: start fresh */ }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [storageKey, questions, mode, skipAnswered]);

  useEffect(() => {
    if (!storageKey || !restored.current || done || leaving.current) return;
    saveSession<Saved>(storageKey, { idx, sels, marked: [...marked], elapsed, graded });
  }, [storageKey, idx, sels, marked, elapsed, graded, done]);

  /** Write one answer to the attempt log; each question at most once per run. */
  const record = useCallback((qq: ClientQuestion, g: Grade, ms: number) => {
    if (g.incomplete || recorded.current.has(qq.id)) return;
    recorded.current.add(qq.id);
    recordAttempts([{ qid: qq.id, lessonId: qq.lessonId, type: qq.type, difficulty: qq.difficulty, correct: g.isCorrect, ms, ts: Date.now(), mode: attemptMode ?? mode }]);
  }, [attemptMode, mode]);

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
    for (const r of out) record(r.q, r.grade, r.ms);
    if (storageKey) clearSession(storageKey);
    onComplete?.(out);
    const next = afterFinish?.(out) ?? null;
    if (next) { router.push(next); return; }
    setResults(out);
    setView('results');
    setReviewing(false);
  }, [bank, questions, sels, graded, record, storageKey, onComplete, afterFinish, router]);

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
    // Tutor mode: the answer is on record now, so leaving at any point keeps it.
    if (mode === 'tutor') record(q, g, ms);
  };

  /** Leaving for good: tutor answers are already saved; a timed attempt is graded as far as it got. */
  const leave = () => {
    if (mode === 'timed') {
      leaving.current = true;
      bank();
      for (const qq of questions) {
        const s = sels[qq.id];
        if (s && hasAnswer(qq, s)) record(qq, gradeQuestion(qq, toResponse(qq, s)), spent.current[qq.id] ?? 0);
      }
      if (storageKey) clearSession(storageKey);
    }
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
                    className={`relative grid h-12 w-full place-items-center rounded-[var(--radius)] border text-sm font-semibold ${a ? 'border-accent bg-accent-soft text-accent-ink' : 'border-line-strong bg-surface text-fg'}`}
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
            <p className="whitespace-nowrap text-xs text-muted">Question {idx + 1} of {questions.length}{done ? ' · review' : ''}</p>
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
              <button type="button" onClick={() => setCalcOpen((v) => !v)} aria-pressed={calcOpen} aria-label="Calculator" className={btn}>
                <CalcIcon size={16} aria-hidden /><span className="hidden md:inline">Calculator</span>
              </button>
            )}
            {!done && (
              <button type="button" onClick={toggleMark} aria-pressed={marked.has(q.id)} aria-label="Mark for review" className={`${btn} ${marked.has(q.id) ? '!border-warn !bg-warn-soft' : ''}`}>
                <Bookmark size={16} className={marked.has(q.id) ? 'fill-current text-warn' : ''} aria-hidden /><span className="hidden md:inline">Mark</span>
              </button>
            )}
            {mode === 'timed' && !done && (
              <button type="button" onClick={() => { bank(); setView('review'); }} aria-label="Review questions" className={btn}>
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
            <p className="mt-1 text-sm text-muted">{mode === 'tutor' ? 'Every answer you checked is saved. You can pick up where you left off.' : 'The questions you answered so far will be graded and saved.'}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setConfirmExit(false)} className={btn}>Stay</button>
              <Link href={backHref} onClick={leave} className="inline-flex h-10 items-center rounded-[var(--radius)] bg-bad px-4 text-sm font-semibold text-white">Leave</Link>
            </div>
          </div>
        </div>
      )}

      {/* Mobile: Passage/Figure ⇄ Question tabs */}
      {stimulus && (
        <div role="tablist" className="grid shrink-0 grid-cols-2 border-b border-line bg-surface lg:hidden">
          {([['stim', stimulus === 'passage' ? 'Passage' : 'Figure'], ['q', 'Question']] as const).map(([k, label]) => (
            <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`h-11 text-sm font-semibold ${tab === k ? 'border-b-2 border-accent text-accent-ink' : 'text-muted'}`}>{label}</button>
          ))}
        </div>
      )}

      {resumeNote && !done && (
        <div role="status" className="flex items-center justify-between gap-3 border-b border-line bg-accent-soft px-4 py-2 text-sm">
          <span>{resumeNote}</span>
          <button type="button" onClick={() => setResumeNote(null)} aria-label="Dismiss" className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-surface-2"><X size={14} aria-hidden /></button>
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
