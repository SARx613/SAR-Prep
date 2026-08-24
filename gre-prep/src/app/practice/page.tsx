'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Calculator, BookText, Shuffle, Loader2, Play } from 'lucide-react';
import { getQuiz, getBankSummary, type Quiz } from '@/app/actions/practice';
import { PracticeSession } from '@/components/practice/PracticeSession';
import type { Section } from '@/types/questions';

/* Practice setup, then the session itself.
 *
 * The setup screen only offers filters the bank can actually satisfy, so a
 * user cannot start a run that would come back empty. */

type Choice = 'mixed' | Section;

const LENGTHS = [5, 10, 20];

export default function PracticePage() {
  const [summary, setSummary] = useState<{ section: string; type: string; n: number }[]>([]);
  const [section, setSection] = useState<Choice>('mixed');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState<'all' | 'easy' | 'hard'>('all');
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getBankSummary().then(setSummary).catch(() => {});
  }, []);

  const available = (s: Choice): number =>
    summary
      .filter((r) => s === 'mixed' || r.section === s)
      .reduce((a, r) => a + r.n, 0);

  const start = useCallback(async () => {
    setLoading(true);
    try {
      const difficulties =
        difficulty === 'easy' ? [1, 2, 3] : difficulty === 'hard' ? [3, 4, 5] : undefined;
      const q = await getQuiz({
        section: section === 'mixed' ? undefined : section,
        difficulties,
        count,
      });
      setQuiz(q);
    } finally {
      setLoading(false);
    }
  }, [section, count, difficulty]);

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

  const total = available(section);

  return (
    <main className="min-h-screen px-4 py-6">
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
            Questions originales rédigées d'après les spécifications officielles du
            GRE — Text Completion, Sentence Equivalence, Reading Comprehension,
            Quantitative Comparison, Problem Solving, Numeric Entry et Data
            Interpretation. Les énoncés sont en anglais, comme à l'examen.
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
                onClick={() => setSection(id)}
                className={`px-4 py-4 rounded-xl border text-left transition ${
                  section === id
                    ? 'border-violet-400/60 bg-violet-500/10'
                    : 'border-white/10 bg-white/[0.02] hover:border-white/25'
                }`}
              >
                <Icon className="w-5 h-5 mb-2 text-violet-300" />
                <p className="font-medium">{label}</p>
                <p className="text-xs text-[var(--text-muted)]">{available(id)} disponibles</p>
              </button>
            ))}
          </div>
        </section>

        {/* Length */}
        <section className="space-y-3">
          <h2 className="text-sm uppercase tracking-wide text-[var(--text-muted)]">Nombre de questions</h2>
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
