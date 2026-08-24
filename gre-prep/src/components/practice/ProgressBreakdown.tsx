'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Trophy, RotateCcw, Target, Percent } from 'lucide-react';
import type { ProgressRow } from '@/app/actions/practice';
import {
  SECTION_LABEL, SUBTOPIC_LABEL, TOPIC_LABEL, TYPE_LABEL, label,
} from '@/lib/labels';

/* Question progress, broken down the way the bank is organised.
 *
 * Three numbers are shown per row, and they answer different questions:
 *
 *   couverture  how much of this category has been seen at all
 *   maîtrisées  how many were right on the LAST attempt — the current state
 *   précision   correct ÷ all attempts, across the whole history
 *
 * Mastery and accuracy diverge on purpose: a category answered badly at
 * first and well since should read as mastered but with middling accuracy,
 * which is what improvement looks like. Collapsing them into one figure
 * would hide exactly that.
 */

interface Props {
  rows: ProgressRow[];
  /** False when signed out: totals are real, progress cannot be. */
  tracked: boolean;
}

/** One line in the breakdown: a label and the six counters. */
interface Line {
  key: string;
  title: string;
  total: number;
  attempted: number;
  mastered: number;
  review: number;
  attempts: number;
  correct: number;
}

interface Group extends Line {
  lines: Line[];
}

/** The counter fields; the label fields are not summable. */
type Counter = 'total' | 'attempted' | 'mastered' | 'review' | 'attempts' | 'correct';

const sum = (rows: readonly Record<Counter, number>[], k: Counter): number =>
  rows.reduce((a, r) => a + r[k], 0);

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

/** Folds several database rows into one line. */
function fold(key: string, title: string, rows: ProgressRow[]): Line {
  return {
    key,
    title,
    total: sum(rows, 'total'),
    attempted: sum(rows, 'attempted'),
    mastered: sum(rows, 'mastered'),
    review: sum(rows, 'review'),
    attempts: sum(rows, 'attempts'),
    correct: sum(rows, 'correct'),
  };
}

/**
 * Verbal groups by question type, quant by topic.
 *
 * Rows are keyed in the database by (type, topic, subtopic), so one theme
 * can arrive as several rows — arithmetic/percent exists as both a Problem
 * Solving and a Numeric Entry question. Those are folded together here, or
 * the same theme would be listed twice with different numbers. The format
 * dimension is not lost: `formatLines` reports it separately.
 */
function groupsFor(section: string, rows: ProgressRow[]): Group[] {
  const inSection = rows.filter((r) => r.section === section);
  const byGroup = new Map<string, ProgressRow[]>();

  for (const r of inSection) {
    const key = section === 'verbal' ? r.type : r.topic;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key)!.push(r);
  }

  const groups = [...byGroup.entries()].map(([key, groupRows]) => {
    const title =
      section === 'verbal' ? label(TYPE_LABEL, key) : label(TOPIC_LABEL, key);

    // Fold the group's rows by subtopic so each theme appears once.
    const bySub = new Map<string, ProgressRow[]>();
    for (const r of groupRows) {
      const sub = r.subtopic ?? r.topic;
      if (!bySub.has(sub)) bySub.set(sub, []);
      bySub.get(sub)!.push(r);
    }

    const lines = [...bySub.entries()]
      .map(([sub, subRows]) => fold(sub, label(SUBTOPIC_LABEL, sub), subRows))
      .sort((a, b) => b.total - a.total);

    return { ...fold(key, title, groupRows), lines };
  });

  return groups.sort((a, b) => b.total - a.total);
}

/** Per-format totals for a section (Problem Solving, Numeric Entry, …). */
function formatLines(section: string, rows: ProgressRow[]): Line[] {
  const inSection = rows.filter((r) => r.section === section);
  const byType = new Map<string, ProgressRow[]>();
  for (const r of inSection) {
    if (!byType.has(r.type)) byType.set(r.type, []);
    byType.get(r.type)!.push(r);
  }
  return [...byType.entries()]
    .map(([t, rs]) => fold(t, label(TYPE_LABEL, t), rs))
    .sort((a, b) => b.total - a.total);
}

function Bar({ mastered, review, total }: { mastered: number; review: number; total: number }) {
  const m = pct(mastered, total);
  const r = pct(review, total);
  return (
    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex">
      <motion.div
        className="h-full bg-emerald-500"
        initial={{ width: 0 }}
        animate={{ width: `${m}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      <motion.div
        className="h-full bg-rose-500/70"
        initial={{ width: 0 }}
        animate={{ width: `${r}%` }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.05 }}
      />
    </div>
  );
}

function Stat({
  icon: Icon, value, caption, color,
}: {
  icon: typeof Trophy; value: string; caption: string; color: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <Icon className="w-4 h-4 mb-2" style={{ color }} />
      <p className="text-xl font-bold leading-none">{value}</p>
      <p className="text-xs text-[var(--text-muted)] mt-1">{caption}</p>
    </div>
  );
}


function Row({
  line, chevron, small,
}: {
  line: Line;
  /** null = no chevron; true/false = expanded state. */
  chevron: boolean | null;
  small?: boolean;
}) {
  return (
    <>
      <div className="flex items-center gap-2 mb-1.5">
        {chevron === null ? (
          small ? null : <span className="w-3.5" />
        ) : (
          <ChevronRight
            className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${
              chevron ? 'rotate-90' : ''
            }`}
          />
        )}
        <span
          className={
            small
              ? 'text-xs flex-1 text-[var(--text-secondary)]'
              : 'text-sm font-medium flex-1'
          }
        >
          {line.title}
        </span>
        <span className="text-xs text-[var(--text-muted)] tabular-nums">
          {line.mastered}/{line.total}
        </span>
        <span
          className={`text-xs w-12 text-right tabular-nums ${
            small ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'
          }`}
        >
          {line.attempts ? `${pct(line.correct, line.attempts)}%` : '—'}
        </span>
      </div>
      <Bar mastered={line.mastered} review={line.review} total={line.total} />
    </>
  );
}

export function ProgressBreakdown({ rows, tracked }: Props) {
  const [open, setOpen] = useState<Set<string>>(new Set());

  const overall = useMemo(
    () => ({
      total: sum(rows, 'total'),
      attempted: sum(rows, 'attempted'),
      mastered: sum(rows, 'mastered'),
      review: sum(rows, 'review'),
      attempts: sum(rows, 'attempts'),
      correct: sum(rows, 'correct'),
    }),
    [rows]
  );

  const toggle = (k: string) =>
    setOpen((prev) => {
      const s = new Set(prev);
      if (s.has(k)) s.delete(k);
      else s.add(k);
      return s;
    });

  return (
    <div className="space-y-8">
      {/* Overall */}
      <section className="space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat
            icon={Trophy}
            color="#10b981"
            value={String(overall.mastered)}
            caption="maîtrisées"
          />
          <Stat
            icon={RotateCcw}
            color="#f43f5e"
            value={String(overall.review)}
            caption="à revoir"
          />
          <Stat
            icon={Target}
            color="#8b5cf6"
            value={`${overall.attempted}/${overall.total}`}
            caption="vues"
          />
          <Stat
            icon={Percent}
            color="#f59e0b"
            value={overall.attempts ? `${pct(overall.correct, overall.attempts)}%` : '—'}
            caption="précision"
          />
        </div>
        <Bar mastered={overall.mastered} review={overall.review} total={overall.total} />
        <p className="text-xs text-[var(--text-muted)]">
          {tracked
            ? `${pct(overall.attempted, overall.total)} % de la banque vue — ${overall.attempts} réponse${overall.attempts > 1 ? 's' : ''} enregistrée${overall.attempts > 1 ? 's' : ''}.`
            : 'Connecte-toi pour enregistrer ta progression : sans compte, les réponses sont corrigées mais pas conservées.'}
        </p>
      </section>

      {/* Per section */}
      {(['verbal', 'quant'] as const).map((section) => {
        const groups = groupsFor(section, rows);
        if (!groups.length) return null;
        const formats = formatLines(section, rows);

        return (
          <section key={section} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm uppercase tracking-wide text-[var(--text-muted)]">
                {SECTION_LABEL[section]}
              </h2>
              <span className="text-xs text-[var(--text-muted)]">
                {sum(groups, 'mastered')}/{sum(groups, 'total')} maîtrisées
              </span>
            </div>

            <div className="rounded-xl border border-white/10 divide-y divide-white/5 overflow-hidden">
              {groups.map((g) => {
                const expandable = g.lines.length > 1;
                const isOpen = open.has(`${section}:${g.key}`);
                return (
                  <div key={g.key}>
                    <button
                      onClick={() => expandable && toggle(`${section}:${g.key}`)}
                      className={`w-full px-4 py-3 text-left transition ${
                        expandable ? 'hover:bg-white/[0.03]' : 'cursor-default'
                      }`}
                      aria-expanded={expandable ? isOpen : undefined}
                    >
                      <Row line={g} chevron={expandable ? isOpen : null} />
                    </button>

                    {isOpen && (
                      <div className="bg-black/20 divide-y divide-white/5">
                        {g.lines.map((l) => (
                          <div key={l.key} className="px-4 py-2.5 pl-10">
                            <Row line={l} chevron={null} small />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* The same questions counted by format rather than by theme. */}
            <details className="group">
              <summary className="text-xs text-[var(--text-secondary)] cursor-pointer hover:text-white transition list-none flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
                Par format de question
              </summary>
              <div className="mt-2 rounded-xl border border-white/10 divide-y divide-white/5 overflow-hidden">
                {formats.map((f) => (
                  <div key={f.key} className="px-4 py-2.5">
                    <Row line={f} chevron={null} small />
                  </div>
                ))}
              </div>
            </details>
          </section>
        );
      })}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full bg-emerald-500 inline-block" />
          maîtrisée — correcte à la dernière tentative
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-1.5 rounded-full bg-rose-500/70 inline-block" />
          à revoir — ratée à la dernière tentative
        </span>
      </div>
    </div>
  );
}
