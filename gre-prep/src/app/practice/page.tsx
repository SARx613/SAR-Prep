'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Calculator, BookText, Shuffle, Loader2, Play,
} from 'lucide-react';
import {
  getQuiz, getBankSummary, getVerbalCategories, type Quiz,
} from '@/app/actions/practice';
import { PracticeSession } from '@/components/practice/PracticeSession';
import type { Section } from '@/types/questions';

/* Practice setup, then the session itself.
 *
 * The verbal picker mirrors the taxonomy the bank is organised by, so a
 * session can drill one skill — inference, say, or three-blank Text
 * Completion — rather than whatever the bank happens to hand out. Counts
 * come from the database, and a category the bank cannot fill is disabled
 * rather than silently returning nothing. */

type SectionChoice = 'mixed' | Section;

const LENGTHS = [5, 10, 20];

/** Display order and labels for the verbal taxonomy. */
const SHORT_VERBAL: { id: string; label: string }[] = [
  { id: 'tc-1-blank', label: 'Text Completion — 1 blanc' },
  { id: 'tc-2-blank', label: 'Text Completion — 2 blancs' },
  { id: 'tc-3-blank', label: 'Text Completion — 3 blancs' },
  { id: 'sentence-equivalence', label: 'Sentence Equivalence' },
];

const READING: { id: string; label: string }[] = [
  { id: 'reasoning', label: 'Reasoning' },
  { id: 'inference', label: 'Inference' },
  { id: 'detail', label: 'Detail' },
  { id: 'global', label: 'Global' },
  { id: 'contextual-function', label: 'Contextual Function' },
  { id: 'other', label: 'Other' },
];

export default function PracticePage() {
  const [summary, setSummary] = useState<{ section: string; type: string; n: number }[]>([]);
  const [categories, setCategories] = useState<
    { subtopic: string; group: 'short' | 'reading'; n: number }[]
  >([]);
  const [section, setSection] = useState<SectionChoice>('mixed');
  const [subtopics, setSubtopics] = useState<Set<string>>(new Set());
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'hard'>('all');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBankSummary().then(setSummary).catch(() => {});
    getVerbalCategories().then(setCategories).catch(() => {});
  }, []);

  const countOf = useCallback(
    (id: string) => categories.find((c) => c.subtopic === id)?.n ?? 0,
    [categories]
  );

  const available = (s: SectionChoice): number =>
    summary.filter((r) => s === 'mixed' || r.section === s).reduce((a, r) => a + r.n, 0);

  // Selecting categories only makes sense within the verbal section; leaving
  // that section clears them so a stale filter cannot empty a quant session.
  const chooseSection = (next: SectionChoice) => {
    setSection(next);
    if (next !== 'verbal') setSubtopics(new Set());
  };

  const toggle = (id: string) =>
    setSubtopics((prev) => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id);
      else s.add(id);
      return s;
    });

  const selectedTotal = useMemo(
    () => [...subtopics].reduce((a, id) => a + countOf(id), 0),
    [subtopics, countOf]
  );

  const total = section === 'verbal' && subtopics.size ? selectedTotal : available(section);

  const start = useCallback(async () => {
    setLoading(true);
    try {
      const difficulties =
        difficulty === 'easy' ? [1, 2, 3] : difficulty === 'hard' ? [3, 4, 5] : undefined;
      const q = await getQuiz({
        section: section === 'mixed' ? undefined : section,
        subtopics: subtopics.size ? [...subtopics] : undefined,
        difficulties,
        count,
      });
      setQuiz(q);
    } finally {
      setLoading(false);
    }
  }, [section, subtopics, count, difficulty]);

  if (quiz) {
    return (
      <main className="min-h-screen px-4 py-6 pb-16">
        <div className="max-w-3xl mx-auto mb-6">
          <button
            onClick={() => setQuiz(null)}
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Quitter la session
          </button>
        </div>
        <PracticeSession quiz={quiz} onRestart={() => setQuiz(null)} />
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 pb-16">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-white transition mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Tableau de bord
          </Link>
          <h1 className="text-3xl font-bold mb-2">Questions GRE</h1>
          <p className="text-[var(--text-secondary)]">
            Questions originales rédigées d&apos;après les spécifications officielles du
            GRE, avec le vocabulaire de tes flashcards. Les énoncés sont en anglais,
            comme à l&apos;examen.
          </p>
        </div>

        {/* Section */}
        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-wide text-[var(--text-muted)]">Section</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {([
              { id: 'mixed', label: 'Mixte', icon: Shuffle },
              { id: 'verbal', label: 'Verbal', icon: BookText },
              { id: 'quant', label: 'Quantitatif', icon: Calculator },
            ] as const).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => chooseSection(id)}
                className={`px-4 py-4 rounded-xl border text-left transition ${
                  section === id
                    ? 'border-violet-400/60 bg-violet-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                }`}
              >
                <Icon className="w-5 h-5 mb-2 text-violet-300" />
                <p className="font-medium">{label}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {available(id)} disponibles
                </p>
              </button>
            ))}
          </div>
        </section>

        {/* Verbal categories */}
        <AnimatePresence>
          {section === 'verbal' && (
            <motion.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4 overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm uppercase tracking-wide text-[var(--text-muted)]">
                  Types de questions
                </h2>
                {subtopics.size > 0 && (
                  <button
                    onClick={() => setSubtopics(new Set())}
                    className="text-xs text-[var(--text-secondary)] hover:text-white transition"
                  >
                    Tout effacer
                  </button>
                )}
              </div>

              <CategoryGroup
                title="Short Verbal"
                items={SHORT_VERBAL}
                countOf={countOf}
                selected={subtopics}
                onToggle={toggle}
              />
              <CategoryGroup
                title="Reading Comprehension"
                items={READING}
                countOf={countOf}
                selected={subtopics}
                onToggle={toggle}
              />

              <p className="text-xs text-[var(--text-muted)]">
                {subtopics.size === 0
                  ? 'Aucun filtre : toutes les questions verbales.'
                  : `${selectedTotal} question${selectedTotal > 1 ? 's' : ''} dans la sélection.`}
              </p>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Length */}
        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-wide text-[var(--text-muted)]">
            Nombre de questions
          </h2>
          <div className="flex gap-3">
            {LENGTHS.map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                disabled={n > total}
                className={`px-5 py-3 rounded-xl border transition disabled:opacity-30 ${
                  count === n
                    ? 'border-violet-400/60 bg-violet-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                }`}
              >
                {n} questions
              </button>
            ))}
          </div>
        </section>

        {/* Difficulty */}
        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-wide text-[var(--text-muted)]">Difficulté</h2>
          <div className="flex gap-3">
            {([
              { id: 'all', label: 'Tous niveaux' },
              { id: 'easy', label: 'Plus facile (1–3)' },
              { id: 'hard', label: 'Plus difficile (3–5)' },
            ] as const).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setDifficulty(id)}
                className={`px-4 py-3 rounded-xl border transition text-sm ${
                  difficulty === id
                    ? 'border-violet-400/60 bg-violet-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={start}
          disabled={loading || total === 0}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-500/20 to-emerald-500/20 border border-violet-400/40 font-semibold hover:from-violet-500/30 hover:to-emerald-500/30 transition inline-flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Préparation…
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Commencer
            </>
          )}
        </motion.button>
      </div>
    </main>
  );
}

function CategoryGroup({
  title,
  items,
  countOf,
  selected,
  onToggle,
}: {
  title: string;
  items: { id: string; label: string }[];
  countOf: (id: string) => number;
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  const total = items.reduce((a, i) => a + countOf(i.id), 0);

  return (
    <div className="rounded-xl border border-white/10 overflow-hidden">
      <div className="px-4 py-2.5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between">
        <span className="text-sm font-medium">{title}</span>
        <span className="text-xs text-[var(--text-muted)]">[{total}]</span>
      </div>
      <div className="divide-y divide-white/5">
        {items.map((item) => {
          const n = countOf(item.id);
          const on = selected.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              disabled={n === 0}
              className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition disabled:opacity-30 ${
                on ? 'bg-violet-500/10' : 'hover:bg-white/[0.03]'
              }`}
            >
              <span
                className={`w-4 h-4 rounded border grid place-items-center shrink-0 ${
                  on ? 'bg-violet-500 border-violet-400' : 'border-white/25'
                }`}
              >
                {on && (
                  <svg viewBox="0 0 12 12" className="w-3 h-3" fill="none">
                    <path d="M2.5 6.5l2.5 2.5 4.5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
              <span className="text-sm flex-1">{item.label}</span>
              <span className="text-xs text-[var(--text-muted)]">[{n}]</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
