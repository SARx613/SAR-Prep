'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, CheckCircle2, XCircle, Flag, RotateCcw, Trophy, Lightbulb,
} from 'lucide-react';
import type { Quiz, ClientQuestion } from '@/app/actions/practice';
import { submitAnswer } from '@/app/actions/practice';
import type { Response } from '@/lib/grading';
import { QuestionView, emptySelection, type Selection } from './QuestionView';
import type { TCContent } from '@/types/questions';

/* Drives one practice run: presents each question, grades it on submit,
 * shows the explanation, and reports a summary at the end.
 *
 * Grading is a server call because the client is never sent the answer key.
 * The result is cached per question so navigating back to an answered item
 * shows what happened rather than re-submitting it. */

interface Answered {
  isCorrect: boolean;
  expected: string[];
  explanation: string | null;
  selection: Selection;
}

const blanksOf = (q: ClientQuestion): number =>
  q.type === 'TC' ? ((q.content as TCContent).blanks?.length ?? 1) : 1;

function toResponse(q: ClientQuestion, s: Selection): Response {
  if (q.type === 'TC') return { kind: 'blanks', ids: s.blanks };
  if (q.type === 'NE') {
    const v = Number(s.numeric.replace(/,/g, '').trim());
    return { kind: 'numeric', value: s.numeric.trim() === '' || Number.isNaN(v) ? null : v };
  }
  const content = q.content as { format?: string };
  if (content.format === 'select_in_passage') return { kind: 'sentence', sentence: s.sentence };
  return { kind: 'choices', ids: s.ids };
}

/** Whether the user has supplied enough to submit. */
function isComplete(q: ClientQuestion, s: Selection): boolean {
  if (q.type === 'TC') return s.blanks.length === blanksOf(q) && s.blanks.every(Boolean);
  if (q.type === 'SE') return s.ids.length === 2;
  if (q.type === 'NE') return s.numeric.trim() !== '' && !Number.isNaN(Number(s.numeric.replace(/,/g, '')));
  const content = q.content as { format?: string };
  if (content.format === 'select_in_passage') return s.sentence.trim().length > 3;
  return s.ids.length > 0;
}

export function PracticeSession({ quiz, onRestart }: { quiz: Quiz; onRestart: () => void }) {
  const [index, setIndex] = useState(0);
  const [selections, setSelections] = useState<Record<string, Selection>>({});
  const [answers, setAnswers] = useState<Record<string, Answered>>({});
  const [pending, setPending] = useState(false);
  const [flagged, setFlagged] = useState<Set<string>>(new Set());
  const startedAt = useRef<number>(Date.now());

  const question = quiz.questions[index];
  const done = index >= quiz.questions.length;

  const passage = useMemo(
    () => quiz.passages.find((p) => p.id === question?.passageId),
    [quiz.passages, question]
  );
  const figure = useMemo(
    () => quiz.figures.find((f) => f.id === question?.figureId),
    [quiz.figures, question]
  );

  // Reset the per-question timer whenever a new question comes up.
  useEffect(() => {
    startedAt.current = Date.now();
  }, [index]);

  const selection = question
    ? (selections[question.id] ?? emptySelection(blanksOf(question)))
    : emptySelection();
  const answered = question ? answers[question.id] : undefined;

  const setSelection = useCallback(
    (next: Selection) => {
      if (!question) return;
      setSelections((prev) => ({ ...prev, [question.id]: next }));
    },
    [question]
  );

  const handleSubmit = useCallback(async () => {
    if (!question || answered || pending) return;
    setPending(true);
    try {
      const result = await submitAnswer(question.id, toResponse(question, selection), {
        timeSpentMs: Date.now() - startedAt.current,
        flagged: flagged.has(question.id),
      });
      setAnswers((prev) => ({
        ...prev,
        [question.id]: { ...result, selection },
      }));
    } finally {
      setPending(false);
    }
  }, [question, selection, answered, pending, flagged]);

  const next = useCallback(() => setIndex((i) => i + 1), []);

  // Enter submits, then advances — the fastest path through a drill.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || done) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' && !answered) {
        e.preventDefault();
        if (isComplete(question, selection)) void handleSubmit();
        return;
      }
      e.preventDefault();
      if (answered) next();
      else if (isComplete(question, selection)) void handleSubmit();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [question, selection, answered, done, handleSubmit, next]);

  /* ── Summary ────────────────────────────────────────────────────────── */
  if (done) {
    const graded = quiz.questions.map((q) => answers[q.id]).filter(Boolean) as Answered[];
    const correct = graded.filter((a) => a.isCorrect).length;
    const pct = graded.length ? Math.round((correct / graded.length) * 100) : 0;

    const byType = quiz.questions.reduce<Record<string, { n: number; ok: number }>>(
      (acc, q) => {
        const a = answers[q.id];
        if (!a) return acc;
        acc[q.type] ??= { n: 0, ok: 0 };
        acc[q.type].n++;
        if (a.isCorrect) acc[q.type].ok++;
        return acc;
      },
      {}
    );

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto text-center space-y-8 py-8"
      >
        <div>
          <Trophy className="w-12 h-12 mx-auto text-amber-400 mb-4" />
          <h2 className="text-3xl font-bold mb-2">Session terminée</h2>
          <p className="text-[var(--text-secondary)]">
            {correct} bonnes réponses sur {graded.length}
          </p>
        </div>

        <div className="text-6xl font-black bg-gradient-to-br from-violet-400 to-emerald-400 bg-clip-text text-transparent">
          {pct}%
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-left">
          {Object.entries(byType).map(([type, s]) => (
            <div
              key={type}
              className="px-4 py-3 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-between"
            >
              <span className="text-sm text-[var(--text-secondary)]">{type}</span>
              <span className="text-sm font-medium">
                {s.ok}/{s.n}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onRestart}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500/15 border border-violet-400/40 hover:bg-violet-500/25 transition"
        >
          <RotateCcw className="w-4 h-4" />
          Nouvelle session
        </button>
      </motion.div>
    );
  }

  const progress = ((index + (answered ? 1 : 0)) / quiz.questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress + meta */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[var(--text-secondary)]">
            Question {index + 1} sur {quiz.questions.length}
          </span>
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-xs uppercase tracking-wide text-[var(--text-muted)]">
              {question.type}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              Difficulté {question.difficulty}/5
            </span>
            <button
              onClick={() =>
                setFlagged((prev) => {
                  const s = new Set(prev);
                  if (s.has(question.id)) s.delete(question.id);
                  else s.add(question.id);
                  return s;
                })
              }
              aria-label="Marquer pour révision"
              className={
                flagged.has(question.id)
                  ? 'text-amber-400'
                  : 'text-[var(--text-muted)] hover:text-white/70'
              }
            >
              <Flag className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-violet-500 to-emerald-500"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          transition={{ duration: 0.18 }}
          className="rounded-2xl bg-[var(--bg-card)]/60 border border-white/8 p-5 sm:p-6"
        >
          <QuestionView
            question={question}
            passage={passage}
            figure={figure}
            selection={selection}
            onSelect={setSelection}
            revealed={answered ? { isCorrect: answered.isCorrect, expected: answered.expected } : null}
          />
        </motion.div>
      </AnimatePresence>

      {/* Explanation */}
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={`rounded-2xl border p-5 ${
                answered.isCorrect
                  ? 'bg-emerald-500/[0.07] border-emerald-400/30'
                  : 'bg-rose-500/[0.07] border-rose-400/30'
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {answered.isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-rose-400" />
                )}
                <span className="font-semibold">
                  {answered.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>
              {answered.explanation && (
                <div className="flex gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-1" />
                  <p className="text-[15px] leading-relaxed text-[var(--text-primary)]/85">
                    {answered.explanation}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action */}
      <div className="flex justify-end">
        {answered ? (
          <button
            onClick={next}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-500/15 border border-violet-400/40 hover:bg-violet-500/25 transition font-medium"
          >
            {index + 1 === quiz.questions.length ? 'Voir les résultats' : 'Suivant'}
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!isComplete(question, selection) || pending}
            className="px-6 py-3 rounded-xl bg-emerald-500/15 border border-emerald-400/40 hover:bg-emerald-500/25 transition font-medium disabled:opacity-35 disabled:cursor-not-allowed"
          >
            {pending ? 'Vérification…' : 'Valider'}
          </button>
        )}
      </div>
    </div>
  );
}
