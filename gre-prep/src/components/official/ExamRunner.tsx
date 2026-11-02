'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle, ArrowLeft, ArrowRight, Calculator as CalcIcon, Clock, Coffee, Eye, EyeOff, Flag,
  ListChecks, Loader2, LogOut, Play, RotateCcw,
} from 'lucide-react';
import { finishExam } from '@/app/actions/official';
import type {
  Answer, ExamContent, ExamResponses, ExamSection, QuantItem, QuantSection, VerbalItem, VerbalSection,
  WritingSection,
} from '@/types/official';
import { hasItems, isWriting } from '@/types/official';
import type { FigureTheme } from '@/lib/figure-theme';
import {
  clearRun, loadRun, newRun, pushLocalHistory, saveRun, type RunState,
} from '@/lib/official-storage';
import { Calculator } from '@/components/exam/Calculator';
import { QuestionLayout } from './QuestionLayout';
import { ExamResults } from './ExamResults';

/* Runs one full-length test the way the computer-delivered exam behaves:
 * one section at a time, a hard clock per section, free movement inside a
 * section (Mark, Review, Back, Next) and no way back once a section is left.
 *
 * Everything that matters is in `RunState`, saved after each change, so a
 * reload resumes the test with the clock still running. */

const BREAK_AFTER_SECTION = 2; // index: the real exam breaks after its third section
const BREAK_MS = 10 * 60 * 1000;

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

function clock(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    // Catch up at once: the last tick may be minutes old (after a break, say).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [active]);
  return now;
}


function isAnswered(a: Answer | undefined): boolean {
  if (!a) return false;
  return Boolean(
    a.ids?.length || a.blanks?.some(Boolean) || a.sentence || a.text?.trim() || a.num?.trim() || a.den?.trim(),
  );
}

/** A multi-blank or two-pick question is only complete when fully answered. */
function isComplete(item: VerbalItem | QuantItem, a: Answer | undefined): boolean {
  if (!isAnswered(a)) return false;
  if (item.type === 'TC') return (a?.blanks ?? []).filter(Boolean).length === item.blanks.length;
  if (item.type === 'SE') return (a?.ids ?? []).length === 2;
  if (item.type === 'NE' && item.format === 'fraction') return Boolean(a?.num?.trim() && a?.den?.trim());
  return true;
}

export function ExamRunner({ exam }: { exam: ExamContent }) {
  // Exam screens are always light and neutral, like the real test (styles-tokens.css).
  return (
    <div className="exam min-h-screen">
      <Runner exam={exam} />
    </div>
  );
}

function Runner({ exam }: { exam: ExamContent }) {
  const [run, setRun] = useState<RunState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [gate, setGate] = useState<'open' | 'running'>('open');
  const theme: FigureTheme = 'paper'; // the exam is always light, like the real test
  const [hideTimer, setHideTimer] = useState(false);
  const [calcOpen, setCalcOpen] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const enteredAt = useRef<number>(0);
  const warned = useRef<string | null>(null);
  const runRef = useRef<RunState | null>(null);
  const submitting = useRef(false);

  /* ── Restore ──────────────────────────────────────────────────────── */
  useEffect(() => {
    // localStorage only exists in the browser, so the saved run can only be read after mount.
    /* eslint-disable react-hooks/set-state-in-effect */
    setRun(loadRun(exam.id));
    setLoaded(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [exam.id]);

  useEffect(() => {
    runRef.current = run;
    if (run) saveRun(run);
  }, [run]);

  const running = !!run && run.phase !== 'done' && gate === 'running';
  const clockActive = running && (run.phase === 'section' || run.phase === 'review' || run.phase === 'break');
  const now = useNow(clockActive);

  const section = run ? exam.sections[run.sectionIndex] : undefined;

  /* ── Leaving the page mid-test ────────────────────────────────────── */
  useEffect(() => {
    if (!run || (run.phase !== 'section' && run.phase !== 'review')) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [run]);

  /* ── State transitions ────────────────────────────────────────────── */

  const update = useCallback((fn: (r: RunState) => RunState) => {
    setRun((r) => (r ? fn(r) : r));
  }, []);

  /** Milliseconds on the question on screen since the last call; restarts the stopwatch. */
  const takeSpent = useCallback(() => {
    const t = Date.now();
    const spent = t - enteredAt.current;
    enteredAt.current = t;
    return spent;
  }, []);

  /** `r` with `spent` ms booked on its current question. */
  const withSpent = useCallback((r: RunState, spent: number): RunState => {
    const s = exam.sections[r.sectionIndex];
    if (r.phase !== 'section' || !hasItems(s)) return r;
    const n = s.items[r.questionIndex]?.n;
    if (n === undefined) return r;
    const mine = { ...(r.timeMs[s.id] ?? {}) };
    mine[n] = (mine[n] ?? 0) + spent;
    return { ...r, timeMs: { ...r.timeMs, [s.id]: mine } };
  }, [exam.sections]);

  const submit = useCallback(async (state: RunState) => {
    submitting.current = true;
    setSubmitError(null);
    const responses: ExamResponses = {};
    for (const s of exam.sections) {
      responses[s.id] = { answers: state.answers[s.id] ?? {}, essay: state.essays[s.id] };
    }
    try {
      const result = await finishExam(exam.id, responses, state.timeMs);
      pushLocalHistory(result);
      setRun((r) => (r ? { ...r, phase: 'done', result } : r));
    } catch {
      submitting.current = false;
      setSubmitError('The test could not be scored right now. Your answers are kept — try again.');
    }
  }, [exam.id, exam.sections]);

  const endSection = useCallback((reason: 'user' | 'time') => {
    const r0 = runRef.current;
    if (!r0) return;
    const r = withSpent(r0, takeSpent());
    setCalcOpen(false);
    setConfirmExit(false);
    if (reason === 'time') setNotice('Time is up for this section: moving on.');

    const next = r.sectionIndex + 1;
    if (next >= exam.sections.length) {
      const done: RunState = { ...r, phase: 'submitting', sectionEndsAt: null };
      setRun(done);
      void submit(done);
      return;
    }
    const brk = r.sectionIndex === BREAK_AFTER_SECTION;
    setRun({
      ...r,
      sectionIndex: next,
      questionIndex: 0,
      sectionEndsAt: null,
      phase: brk ? 'break' : 'section-intro',
      breakEndsAt: brk ? Date.now() + BREAK_MS : null,
    });
  }, [exam.sections.length, submit, takeSpent, withSpent]);

  const startSection = () => {
    if (!section) return;
    enteredAt.current = Date.now();
    warned.current = null;
    update((r) => ({
      ...r,
      phase: 'section',
      questionIndex: 0,
      sectionEndsAt: Date.now() + section.minutes * 60_000,
    }));
  };

  const go = (index: number) => {
    const spent = takeSpent();
    update((r) => ({ ...withSpent(r, spent), phase: 'section', questionIndex: index }));
  };

  const openReview = () => {
    const spent = takeSpent();
    update((r) => ({ ...withSpent(r, spent), phase: 'review' }));
  };

  /* A reload during the final submission would otherwise sit on the spinner forever. */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (running && run?.phase === 'submitting' && !submitting.current) void submit(run);
  }, [running, run, submit]);

  /* Section clock: runs out → move on, whatever the user was doing. */
  useEffect(() => {
    if (!run || !running) return;
    if ((run.phase === 'section' || run.phase === 'review') && run.sectionEndsAt && now >= run.sectionEndsAt) {
      // The clock is external state: running out is a reason to change screens.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      endSection('time');
    }
    if (run.phase === 'break' && run.breakEndsAt && now >= run.breakEndsAt) {
      update((r) => ({ ...r, phase: 'section-intro', breakEndsAt: null }));
    }
  }, [now, run, running, endSection, update]);

  /* Five-minute warning, once per section. */
  useEffect(() => {
    if (!run?.sectionEndsAt || !section || warned.current === section.id) return;
    if (run.sectionEndsAt - now <= 5 * 60_000 && run.sectionEndsAt - now > 0 && section.minutes > 5) {
      warned.current = section.id;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotice('Il te reste 5 minutes dans cette section.');
    }
  }, [now, run?.sectionEndsAt, section]);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(t);
  }, [notice]);

  /* ── Answers ──────────────────────────────────────────────────────── */

  const item = section && hasItems(section) && run ? section.items[run.questionIndex] : undefined;

  const setAnswer = (n: number, a: Answer) =>
    update((r) => {
      const s = exam.sections[r.sectionIndex];
      return { ...r, answers: { ...r.answers, [s.id]: { ...(r.answers[s.id] ?? {}), [n]: a } } };
    });

  const toggleMark = (n: number) =>
    update((r) => {
      const s = exam.sections[r.sectionIndex];
      const cur = r.marked[s.id] ?? [];
      return { ...r, marked: { ...r.marked, [s.id]: cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n] } };
    });

  const setEssay = (text: string) =>
    update((r) => {
      const s = exam.sections[r.sectionIndex];
      return { ...r, essays: { ...r.essays, [s.id]: text } };
    });

  /* ── Screens ──────────────────────────────────────────────────────── */

  if (!loaded) {
    return (
      <Center>
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </Center>
    );
  }

  // A finished test stays viewable until the user starts another.
  if (run?.phase === 'done' && run.result) {
    return (
      <ExamResults
        exam={exam}
        result={run.result}
        answers={run.answers}
        essays={run.essays}
        onRetake={() => {
          clearRun(exam.id);
          setRun(null);
          setGate('open');
        }}
      />
    );
  }

  if (!run || gate === 'open') {
    return (
      <Gate
        exam={exam}
        saved={run}
        onStart={() => {
          clearRun(exam.id);
          const fresh = newRun(exam.id);
          setRun(fresh);
          setGate('running');
        }}
        onResume={() => {
          enteredAt.current = Date.now();
          setGate('running');
        }}
      />
    );
  }

  if (run.phase === 'submitting') {
    return (
      <Center>
        {submitError ? (
          <div className="max-w-md space-y-4 text-center">
            <AlertTriangle className="mx-auto h-10 w-10 text-warn" />
            <p className="text-muted">{submitError}</p>
            <button
              onClick={() => void submit(run)}
              className="inline-flex items-center gap-2 rounded-xl border border-accent bg-accent-soft px-5 py-3 font-medium transition hover:bg-accent-soft"
            >
              <RotateCcw className="h-4 w-4" /> Try again
            </button>
          </div>
        ) : (
          <div className="space-y-3 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent-ink" />
            <p className="text-muted">Scoring…</p>
          </div>
        )}
      </Center>
    );
  }

  if (!section) return null;

  if (run.phase === 'break') {
    return (
      <BreakScreen
        remaining={(run.breakEndsAt ?? now) - now}
        onSkip={() => update((r) => ({ ...r, phase: 'section-intro', breakEndsAt: null }))}
      />
    );
  }

  if (run.phase === 'section-intro') {
    return <SectionIntro exam={exam} section={section} notice={notice} onStart={startSection} />;
  }

  /* ── In a section ─────────────────────────────────────────────────── */

  const remaining = (run.sectionEndsAt ?? now) - now;
  const low = remaining <= 5 * 60_000;
  const answers = run.answers[section.id] ?? {};
  const marked = run.marked[section.id] ?? [];
  const total = hasItems(section) ? section.items.length : 1;
  const unanswered = hasItems(section)
    ? section.items.filter((it) => !isComplete(it, answers[it.n])).length
    : 0;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Title bar */}
      <header
        className="z-30 border-b border-line bg-bg/95 backdrop-blur sm:sticky sm:top-0"
        style={{ paddingTop: 'var(--sat)' }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {exam.title} · Section {section.number} of {exam.sections.length}
            </p>
            <p className="truncate text-xs text-muted">
              {section.title}
              {hasItems(section) && run.phase === 'section' && ` · Question ${run.questionIndex + 1} of ${total}`}
              {run.phase === 'review' && ' · Review'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cx(
                'flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-sm tabular-nums',
                low ? 'border-bad bg-bad-soft text-bad' : 'border-line bg-surface-2',
              )}
            >
              <Clock className="h-4 w-4 opacity-70" />
              <span className={cx(hideTimer && 'select-none blur-sm')}>{clock(remaining)}</span>
              <button
                onClick={() => setHideTimer((h) => !h)}
                aria-label={hideTimer ? 'Show the timer' : 'Hide the timer'}
                className="text-faint hover:text-fg"
              >
                {hideTimer ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2 px-4 pb-2.5">
          {hasItems(section) && item && (
            <>
              <ToolButton
                active={marked.includes(item.n)}
                onClick={() => toggleMark(item.n)}
                icon={<Flag className="h-4 w-4" />}
                label={marked.includes(item.n) ? 'Marked' : 'Mark'}
              />
              <ToolButton
                active={run.phase === 'review'}
                onClick={() => (run.phase === 'review' ? go(run.questionIndex) : openReview())}
                icon={<ListChecks className="h-4 w-4" />}
                label="Review"
              />
              {section.kind === 'quant' && (
                <ToolButton
                  active={calcOpen}
                  onClick={() => setCalcOpen((c) => !c)}
                  icon={<CalcIcon className="h-4 w-4" />}
                  label="Calculator"
                />
              )}
              <span className="mx-1 hidden h-5 w-px bg-line sm:block" />
              <ToolButton
                onClick={() => go(Math.max(0, run.questionIndex - 1))}
                disabled={run.phase !== 'section' || run.questionIndex === 0}
                icon={<ArrowLeft className="h-4 w-4" />}
                label="Back"
              />
              <ToolButton
                onClick={() => (run.questionIndex + 1 >= total ? openReview() : go(run.questionIndex + 1))}
                disabled={run.phase !== 'section'}
                icon={<ArrowRight className="h-4 w-4" />}
                label={run.questionIndex + 1 >= total ? 'Review' : 'Next'}
                iconRight
                primary
              />
            </>
          )}
          <span className="flex-1" />
          <ToolButton
            onClick={() => setConfirmExit(true)}
            icon={<LogOut className="h-4 w-4" />}
            label="Exit section"
            danger
          />
        </div>
      </header>

      {notice && (
        <div className="fixed left-1/2 top-24 z-40 -translate-x-1/2 rounded-xl border border-warn bg-warn-soft px-4 py-2.5 text-sm text-warn shadow-xl backdrop-blur">
          {notice}
        </div>
      )}

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5">
        {isWriting(section) ? (
          <WritingPane section={section} text={run.essays[section.id] ?? ''} onChange={setEssay} />
        ) : run.phase === 'review' ? (
          <ReviewGrid
            section={section}
            answers={answers}
            marked={marked}
            onGo={go}
            current={run.questionIndex}
          />
        ) : item ? (
          <QuestionLayout
            section={section}
            item={item}
            answer={answers[item.n]}
            theme={theme}
            onChange={(a) => setAnswer(item.n, a)}
          />
        ) : null}
      </main>

      {calcOpen && section.kind === 'quant' && (
        <Calculator
          onClose={() => setCalcOpen(false)}
          onTransfer={
            item && item.type === 'NE' && (item as QuantItem).format === 'numeric'
              ? (v: string) => setAnswer(item.n, { text: v })
              : undefined
          }
        />
      )}

      {confirmExit && (
        <ConfirmDialog
          unanswered={unanswered}
          onCancel={() => setConfirmExit(false)}
          onConfirm={() => endSection('user')}
        />
      )}
    </div>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

function Center({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center px-6">{children}</div>;
}

function ToolButton({
  icon, label, onClick, disabled, active, primary, danger, iconRight,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  primary?: boolean;
  danger?: boolean;
  iconRight?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-35',
        primary && 'border-accent bg-accent-soft hover:bg-accent-soft',
        danger && 'border-bad text-bad hover:bg-bad-soft',
        !primary && !danger && (active ? 'border-warn bg-warn-soft text-warn' : 'border-line bg-surface-2 hover:bg-surface-2'),
      )}
    >
      {!iconRight && icon}
      <span>{label}</span>
      {iconRight && icon}
    </button>
  );
}

function WritingPane({
  section, text, onChange,
}: {
  section: WritingSection;
  text: string;
  onChange: (t: string) => void;
}) {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      <div className="space-y-4 rounded-2xl border border-line bg-surface p-5 lg:sticky lg:top-32 lg:self-start">
        <p className="text-xs uppercase tracking-wide text-faint">
          {section.kind === 'issue' ? 'Analyze an Issue' : 'Analyze an Argument'}
        </p>
        {section.prompt.topic.map((p, i) => (
          <p key={i} className="text-[16px] leading-relaxed">{p}</p>
        ))}
        <p className="border-t border-line pt-4 text-[15px] leading-relaxed text-muted">
          {section.prompt.task}
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
          placeholder="Type your response here. As on the real test, there is no spell-check."
          className="min-h-[55vh] w-full flex-1 resize-y rounded-2xl border border-line bg-surface-2 p-5 text-[16px] leading-relaxed outline-none focus:border-accent"
        />
        <p className="text-right text-xs text-faint">{words} words</p>
      </div>
    </div>
  );
}

function ReviewGrid({
  section, answers, marked, onGo, current,
}: {
  section: VerbalSection | QuantSection;
  answers: Record<number, Answer>;
  marked: number[];
  onGo: (i: number) => void;
  current: number;
}) {
  const stats = useMemo(() => {
    const done = section.items.filter((it) => isComplete(it, answers[it.n])).length;
    return { done, left: section.items.length - done, marked: marked.length };
  }, [section.items, answers, marked]);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h2 className="text-2xl font-bold">Section review</h2>
        <p className="mt-1 text-muted">
          {stats.done} answered · {stats.left} not fully answered · {stats.marked} marked. Click a question to go back to it.
        </p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-line">
        {section.items.map((it, i) => {
          const done = isComplete(it, answers[it.n]);
          const partial = !done && isAnswered(answers[it.n]);
          return (
            <button
              key={it.n}
              onClick={() => onGo(i)}
              className={cx(
                'flex w-full items-center gap-3 border-b border-line px-4 py-2.5 text-left transition last:border-0 hover:bg-surface-2',
                i === current && 'bg-accent-soft',
              )}
            >
              <span className="w-8 text-sm font-semibold tabular-nums text-muted">{it.n}</span>
              <span className="w-12 text-xs uppercase tracking-wide text-faint">{it.type}</span>
              <span
                className={cx(
                  'flex-1 text-sm',
                  done ? 'text-good' : partial ? 'text-warn' : 'text-faint',
                )}
              >
                {done ? 'Answered' : partial ? 'Incomplete' : 'Not answered'}
              </span>
              {marked.includes(it.n) && <Flag className="h-4 w-4 text-warn" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConfirmDialog({
  unanswered, onCancel, onConfirm,
}: {
  unanswered: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md space-y-4 rounded-2xl border border-line bg-[var(--bg-card)] p-6 shadow-2xl">
        <AlertTriangle className="h-8 w-8 text-warn" />
        <h3 className="text-xl font-bold">Exit this section?</h3>
        <p className="text-muted">
          You will not be able to return to it.
          {unanswered > 0 && ` ${unanswered} question${unanswered > 1 ? 's are' : ' is'} not fully answered.`}
        </p>
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onCancel} className="rounded-xl border border-line px-4 py-2.5 transition hover:bg-surface-2">
            Stay
          </button>
          <button
            onClick={onConfirm}
            className="rounded-xl border border-bad bg-bad-soft px-4 py-2.5 font-medium transition hover:bg-bad-soft"
          >
            Exit section
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionIntro({
  exam, section, notice, onStart,
}: {
  exam: ExamContent;
  section: ExamSection;
  notice: string | null;
  onStart: () => void;
}) {
  const count = hasItems(section) ? section.items.length : 1;
  return (
    <Center>
      <div className="w-full max-w-2xl space-y-6 py-10">
        {notice && (
          <p className="rounded-xl border border-warn bg-warn-soft px-4 py-2.5 text-sm text-warn">{notice}</p>
        )}
        <div>
          <p className="text-sm uppercase tracking-wide text-faint">
            {exam.title} · Section {section.number} of {exam.sections.length}
          </p>
          <h1 className="mt-1 text-3xl font-bold">{section.title}</h1>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-lg border border-line bg-surface-2 px-3 py-1.5">{section.minutes} minutes</span>
          <span className="rounded-lg border border-line bg-surface-2 px-3 py-1.5">
            {hasItems(section) ? `${count} questions` : '1 task'}
          </span>
          {section.kind === 'quant' && (
            <span className="rounded-lg border border-line bg-surface-2 px-3 py-1.5">Calculator available</span>
          )}
        </div>
        <p className="rounded-2xl border border-line bg-surface p-5 text-[15px] leading-relaxed text-muted">
          {section.directions}
        </p>
        <p className="text-sm text-faint">
          The clock starts as soon as you begin the section. Once you leave a section you cannot return to it.
        </p>
        <button
          onClick={onStart}
          className="inline-flex items-center gap-2 rounded-xl border border-good bg-good-soft px-6 py-3.5 text-lg font-semibold transition hover:bg-good-soft"
        >
          <Play className="h-5 w-5" /> Begin section
        </button>
      </div>
    </Center>
  );
}

function BreakScreen({ remaining, onSkip }: { remaining: number; onSkip: () => void }) {
  return (
    <Center>
      <div className="max-w-md space-y-5 text-center">
        <Coffee className="mx-auto h-12 w-12 text-warn" />
        <h1 className="text-3xl font-bold">10-minute break</h1>
        <p className="text-muted">
          As on the real test, an optional break follows the third section. The test resumes automatically when the countdown ends.
        </p>
        <p className="font-mono text-5xl tabular-nums">{clock(remaining)}</p>
        <button
          onClick={onSkip}
          className="inline-flex items-center gap-2 rounded-xl border border-accent bg-accent-soft px-5 py-3 font-medium transition hover:bg-accent-soft"
        >
          Resume now <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </Center>
  );
}

function Gate({
  exam, saved, onStart, onResume,
}: {
  exam: ExamContent;
  saved: RunState | null;
  onStart: () => void;
  onResume: () => void;
}) {
  const total = exam.sections.reduce((a, s) => a + s.minutes, 0);
  const inProgress = saved && saved.phase !== 'done';
  const sec = saved ? exam.sections[saved.sectionIndex] : undefined;

  return (
    <main className="page">
      <div className="page-container max-w-2xl space-y-8">
        <div>
          <Link
            href="/official-tests"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted transition hover:text-fg"
          >
            <ArrowLeft className="h-4 w-4" /> Official tests
          </Link>
          <h1 className="text-3xl font-bold">{exam.title}</h1>
          <p className="mt-2 text-muted">
            A full-length ETS test, taken under computer-delivered exam conditions.
          </p>
        </div>

        {inProgress && sec && (
          <div className="space-y-3 rounded-2xl border border-warn bg-amber-500/[0.07] p-5">
            <p className="font-semibold">A test is in progress</p>
            <p className="text-sm text-muted">
              You were at section {sec.number} ({sec.title}). If a section was open, its clock kept running.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={onResume}
                className="inline-flex items-center gap-2 rounded-xl border border-good bg-good-soft px-5 py-2.5 font-medium transition hover:bg-good-soft"
              >
                <Play className="h-4 w-4" /> Resume
              </button>
              <button
                onClick={() => {
                  if (confirm('Abandon this test and start a new one?')) onStart();
                }}
                className="rounded-xl border border-line px-5 py-2.5 transition hover:bg-surface-2"
              >
                Start over
              </button>
            </div>
          </div>
        )}

        <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
          {exam.sections.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <span>
                <span className="mr-3 text-sm text-faint">{s.number}</span>
                {s.title}
              </span>
              <span className="shrink-0 text-sm text-muted">
                {s.minutes} min{hasItems(s) ? ` · ${s.items.length} q.` : ''}
              </span>
            </li>
          ))}
        </ol>

        <ul className="space-y-2 text-[15px] text-muted">
          <li>Length: {Math.floor(total / 60)} h {total % 60 ? `${total % 60} min` : ''}, plus an optional 10-minute break after section 3.</li>
          <li>One clock per section; you can mark questions, review the section and move freely inside it, but not return after leaving it.</li>
          <li>In the Quant sections an on-screen calculator is available.</li>
          <li>Answers and the 130–170 score are shown only at the end, as on the real test.</li>
          <li>The sections follow the book’s structure (2 writing tasks, 2 Verbal and 2 Quant sections of 25 questions), which differs from the current, shorter online exam.</li>
        </ul>

        {!inProgress && (
          <button
            onClick={onStart}
            className="inline-flex items-center gap-2 rounded-xl border border-good bg-good-soft px-6 py-3.5 text-lg font-semibold transition hover:bg-good-soft"
          >
            <Play className="h-5 w-5" /> Start the test
          </button>
        )}
      </div>
    </main>
  );
}
