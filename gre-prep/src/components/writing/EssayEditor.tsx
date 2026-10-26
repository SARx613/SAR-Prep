'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, Eye, EyeOff, Sparkles } from 'lucide-react';
import { saveEssay, wordCount, type Essay } from '@/lib/essays';

/* The writing screen: ETS's own word processor offers insert, delete, cut,
 * paste and undo, and no spell-checker or grammar checker — so this is a bare
 * textarea with every browser "help" switched off. Thirty minutes, then the
 * rubric check from the official scoring guide. */

const SECONDS = 30 * 60;
const CRITERIA = [
  ['position', 'Position', 'A clear position that follows the specific task directions'],
  ['development', 'Development', 'Reasons and examples that support the position'],
  ['organization', 'Focus & organisation', 'Ideas connected logically; stays on the point'],
  ['language', 'Language', 'Clear, precise wording and sentence variety'],
  ['conventions', 'Conventions', 'Grammar, usage and mechanics'],
] as const;
const LEVELS = [['6', 'Outstanding'], ['5', 'Strong'], ['4', 'Adequate'], ['3', 'Limited'], ['2', 'Seriously flawed'], ['1', 'Deficient']] as const;
const fmt = (s: number) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

interface Props { claim: string; instruction: string; aiEnabled: boolean }

export function EssayEditor({ claim, instruction, aiEnabled }: Props) {
  const [text, setText] = useState('');
  const [left, setLeft] = useState(SECONDS);
  const [showTimer, setShowTimer] = useState(true);
  const [showCount, setShowCount] = useState(false);
  const [done, setDone] = useState(false);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [ai, setAi] = useState<Essay['ai'] | null>(null);
  const [aiErr, setAiErr] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const id = useRef(`e${Math.random().toString(36).slice(2, 10)}`);
  const started = useRef(0);

  useEffect(() => { started.current = Date.now(); }, []);
  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [done]);

  const finish = useCallback(() => {
    setDone(true);
    saveEssay({ id: id.current, ts: Date.now(), claim, instruction, text, seconds: Math.min(SECONDS, Math.round((Date.now() - started.current) / 1000)) });
  }, [claim, instruction, text]);
  useEffect(() => { if (left <= 0 && !done) finish(); }, [left, done, finish]);

  const selfScore = (() => {
    const v = Object.values(levels);
    if (v.length < CRITERIA.length) return undefined;
    return Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 2) / 2;
  })();

  const persist = (extra: Partial<Essay>) =>
    saveEssay({ id: id.current, ts: Date.now(), claim, instruction, text, seconds: SECONDS - left, ...extra });

  const askAi = async () => {
    setAiBusy(true); setAiErr('');
    try {
      const r = await fetch('/api/essay-score', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ claim, instruction, text }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? 'Failed');
      setAi(j); persist({ ai: { score: j.score, summary: j.summary, improvements: j.improvements }, selfScore });
    } catch (e) { setAiErr(e instanceof Error ? e.message : 'Failed'); }
    setAiBusy(false);
  };

  const btn = 'inline-flex h-10 items-center gap-1.5 rounded-[var(--radius)] border border-line-strong bg-surface px-3 text-sm font-semibold hover:bg-surface-2';

  if (done) {
    return (
      <div className="exam min-h-dvh">
        <div className="mx-auto max-w-3xl px-4 pb-16" style={{ paddingTop: 'calc(1.5rem + var(--sat))' }}>
          <h1 className="text-2xl font-bold">Check your essay against the scoring guide</h1>
          <p className="mt-1 text-sm text-muted">{wordCount(text)} words · {fmt(SECONDS - Math.max(0, left))} used. Be strict: raters are.</p>
          <div className="mt-5 space-y-4">
            {CRITERIA.map(([k, label, hint]) => (
              <fieldset key={k} className="rounded-[var(--radius)] border border-line bg-surface p-4">
                <legend className="px-1 font-semibold">{label} <span className="font-normal text-muted">— {hint}</span></legend>
                <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
                  {LEVELS.map(([n, name]) => (
                    <button key={n} role="radio" aria-checked={levels[k] === Number(n)} onClick={() => setLevels((p) => ({ ...p, [k]: Number(n) }))}
                      className={`min-h-[40px] rounded-full border px-3 text-sm font-semibold ${levels[k] === Number(n) ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong bg-surface text-muted'}`}>{n} · {name}</button>
                  ))}
                </div>
              </fieldset>
            ))}
          </div>
          {selfScore !== undefined && (
            <p className="mt-5 rounded-[var(--radius)] bg-accent-soft px-4 py-3 text-lg font-bold text-accent">Your own estimate: {selfScore} / 6</p>
          )}
          {aiEnabled && (
            <div className="mt-5">
              <button onClick={askAi} disabled={aiBusy || wordCount(text) < 40} className={`${btn} disabled:opacity-40`}><Sparkles size={16} aria-hidden />{aiBusy ? 'Scoring…' : 'Get an AI estimate'}</button>
              {aiErr && <p className="mt-2 text-sm text-bad">{aiErr}</p>}
              {ai && (
                <div className="mt-3 rounded-[var(--radius)] border border-line bg-surface p-4 text-sm">
                  <p className="text-lg font-bold">AI estimate: {ai.score} / 6 <span className="text-xs font-medium text-muted">(an estimate, not an official score)</span></p>
                  <p className="mt-1 text-muted">{ai.summary}</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5">{ai.improvements.map((x, i) => <li key={i}>{x}</li>)}</ul>
                </div>
              )}
            </div>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <button onClick={() => persist({ selfScore })} className={btn}>Save my check</button>
            <Link href="/writing" className="inline-flex h-10 items-center rounded-[var(--radius)] bg-accent px-5 text-sm font-bold text-accent-fg">Done</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="exam flex h-dvh flex-col">
      <header className="shrink-0 border-b border-line-strong bg-surface px-3 py-2" style={{ paddingTop: 'calc(0.5rem + var(--sat))', paddingLeft: 'max(0.75rem, var(--sal))', paddingRight: 'max(0.75rem, var(--sar))' }}>
        <div className="flex flex-wrap items-center gap-2">
          <p className="mr-auto text-sm font-bold">Analyze an Issue</p>
          {showTimer && <span role="timer" className="inline-flex h-10 items-center gap-1.5 rounded-[var(--radius)] border border-line px-2.5 text-sm font-semibold tabular-nums"><Clock size={15} aria-hidden />{fmt(left)}</span>}
          <button onClick={() => setShowTimer((v) => !v)} aria-label={showTimer ? 'Hide timer' : 'Show timer'} className={btn}>{showTimer ? <EyeOff size={16} /> : <Eye size={16} />}</button>
          <button onClick={() => setShowCount((v) => !v)} aria-pressed={showCount} className={btn}>{showCount ? `${wordCount(text)} words` : 'Word count'}</button>
          <button onClick={finish} className="inline-flex h-10 items-center rounded-[var(--radius)] bg-accent px-4 text-sm font-bold text-accent-fg">Finish</button>
        </div>
      </header>
      <main className="min-h-0 flex-1 overflow-y-auto lg:grid lg:grid-cols-2 lg:overflow-hidden">
        <section className="border-b border-line p-4 sm:p-6 lg:overflow-y-auto lg:border-b-0 lg:border-r" aria-label="Issue">
          <p className="text-[17px] font-medium leading-relaxed">{claim}</p>
          <p className="mt-4 text-[15px] leading-relaxed text-muted">{instruction}</p>
        </section>
        <section className="flex flex-col p-4 sm:p-6" aria-label="Your response">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
            autoComplete="off"
            aria-label="Essay"
            placeholder="Type your response here…"
            className="min-h-[50dvh] w-full flex-1 resize-none rounded-[var(--radius)] border border-line-strong bg-surface p-3 text-[16px] leading-relaxed focus:border-accent lg:min-h-0"
          />
        </section>
      </main>
    </div>
  );
}
