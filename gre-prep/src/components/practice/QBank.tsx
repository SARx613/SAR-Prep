'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';
import { useAttempts } from '@/hooks/useAttempts';
import { buildQueue } from '@/lib/srs';
import type { QIndexItem } from '@/content/qindex';

/* The Qbank: pick what to practise and how. Filters combine; the count is
 * live. “Missed” and “Not yet seen” come from the local attempt log. */

const SECTIONS = [['all', 'Both'], ['quant', 'Quant'], ['verbal', 'Verbal']] as const;
const TYPES: Record<string, string> = { QC: 'Quantitative Comparison', PS: 'Problem Solving', NE: 'Numeric Entry', DI: 'Data Interpretation', TC: 'Text Completion', SE: 'Sentence Equivalence', RC: 'Reading Comprehension' };
const STATUS = [['all', 'Any'], ['new', 'Not yet seen'], ['missed', 'Missed'], ['due', 'Due for review']] as const;

const chip = (on: boolean) =>
  `min-h-[40px] rounded-full border px-3.5 text-sm font-semibold transition-colors ${on ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong bg-surface text-muted hover:text-fg'}`;

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-2"><legend className="text-xs font-bold uppercase tracking-wide text-faint">{title}</legend><div className="flex flex-wrap gap-2">{children}</div></fieldset>
  );
}

function shuffle<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function QBank({ index, chapters }: { index: QIndexItem[]; chapters: { id: string; title: string; track: string }[] }) {
  const router = useRouter();
  const attempts = useAttempts();
  const [now] = useState(() => Date.now());
  const [section, setSection] = useState<(typeof SECTIONS)[number][0]>('all');
  const [types, setTypes] = useState<string[]>([]);
  const [chs, setChs] = useState<string[]>([]);
  const [dMin, setDMin] = useState(1);
  const [dMax, setDMax] = useState(5);
  const [status, setStatus] = useState<(typeof STATUS)[number][0]>('all');
  const [count, setCount] = useState(20);
  const [timed, setTimed] = useState(false);

  const { seen, missed, due } = useMemo(() => {
    const last = new Map<string, boolean>();
    for (const a of attempts) if (a.mode !== 'check') last.set(a.qid, a.correct);
    return {
      seen: new Set(last.keys()),
      missed: new Set([...last].filter(([, ok]) => !ok).map(([id]) => id)),
      due: new Set(buildQueue(attempts, now).due.map((d) => d.qid)),
    };
  }, [attempts, now]);

  const pool = useMemo(
    () =>
      index.filter(
        (q) =>
          (section === 'all' || q.section === section) &&
          (types.length === 0 || types.includes(q.type)) &&
          (chs.length === 0 || chs.includes(q.chapter)) &&
          q.difficulty >= dMin && q.difficulty <= dMax &&
          (status === 'all' || (status === 'new' && !seen.has(q.id)) || (status === 'missed' && missed.has(q.id)) || (status === 'due' && due.has(q.id))),
      ),
    [index, section, types, chs, dMin, dMax, status, seen, missed, due],
  );

  const toggle = (list: string[], v: string, set: (x: string[]) => void) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const n = Math.min(count, pool.length);
  const visibleTypes = Object.keys(TYPES).filter((t) => (section === 'all' ? true : section === 'quant' ? ['QC', 'PS', 'NE', 'DI'].includes(t) : ['TC', 'SE', 'RC'].includes(t)));
  const visibleChapters = chapters.filter((c) => (section === 'all' ? ['quant', 'verbal'].includes(c.track) : c.track === section));

  const start = () => {
    const ids = shuffle(pool).slice(0, n).map((q) => q.id);
    router.push(`/exam/custom?ids=${ids.join(',')}&mode=${timed ? 'timed' : 'tutor'}`);
  };

  return (
    <div className="space-y-6">
      <Group title="Section">{SECTIONS.map(([id, label]) => <button key={id} aria-pressed={section === id} onClick={() => { setSection(id); setTypes([]); setChs([]); }} className={chip(section === id)}>{label}</button>)}</Group>
      <Group title="Question type">{visibleTypes.map((t) => <button key={t} aria-pressed={types.includes(t)} onClick={() => toggle(types, t, setTypes)} className={chip(types.includes(t))}>{TYPES[t]}</button>)}</Group>
      <Group title="Chapter">{visibleChapters.map((c) => <button key={c.id} aria-pressed={chs.includes(c.id)} onClick={() => toggle(chs, c.id, setChs)} className={chip(chs.includes(c.id))}>{c.title}</button>)}</Group>
      <Group title="Status">{STATUS.map(([id, label]) => <button key={id} aria-pressed={status === id} onClick={() => setStatus(id)} className={chip(status === id)}>{label}{id === 'missed' && missed.size ? ` (${missed.size})` : ''}{id === 'due' && due.size ? ` (${due.size})` : ''}</button>)}</Group>

      <fieldset className="space-y-2">
        <legend className="text-xs font-bold uppercase tracking-wide text-faint">Difficulty</legend>
        <div className="flex items-center gap-3 text-sm">
          <label className="flex items-center gap-2">From
            <select value={dMin} onChange={(e) => { const v = +e.target.value; setDMin(v); if (v > dMax) setDMax(v); }} className="h-10 rounded-[var(--radius)] border border-line-strong bg-surface px-2">{[1, 2, 3, 4, 5].map((d) => <option key={d}>{d}</option>)}</select></label>
          <label className="flex items-center gap-2">to
            <select value={dMax} onChange={(e) => { const v = +e.target.value; setDMax(v); if (v < dMin) setDMin(v); }} className="h-10 rounded-[var(--radius)] border border-line-strong bg-surface px-2">{[1, 2, 3, 4, 5].map((d) => <option key={d}>{d}</option>)}</select></label>
        </div>
      </fieldset>

      <Group title="Length">{[10, 20, 30, 40].map((c) => <button key={c} aria-pressed={count === c} onClick={() => setCount(c)} className={chip(count === c)}>{c} questions</button>)}</Group>
      <Group title="Mode">
        <button aria-pressed={!timed} onClick={() => setTimed(false)} className={chip(!timed)}>With explanations</button>
        <button aria-pressed={timed} onClick={() => setTimed(true)} className={chip(timed)}>Timed, like the test</button>
      </Group>

      <div className="sticky bottom-[calc(4.5rem+var(--sab))] z-10 rounded-[var(--radius)] border border-line bg-surface/95 p-3 backdrop-blur lg:static lg:bottom-auto">
        <p className="mb-2 text-sm text-muted" aria-live="polite">{pool.length} matching question{pool.length === 1 ? '' : 's'}{pool.length > 0 ? ` · you’ll get ${n}` : ''}.</p>
        <button disabled={pool.length === 0} onClick={start} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-accent px-6 font-bold text-accent-fg disabled:opacity-40 sm:w-auto"><Play size={18} aria-hidden />Start</button>
      </div>
    </div>
  );
}
