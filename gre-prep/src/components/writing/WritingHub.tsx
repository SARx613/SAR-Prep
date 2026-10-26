'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, PenLine } from 'lucide-react';
import { useLocalValue } from '@/hooks/useLocalValue';
import { ESSAYS_KEY, parseEssays } from '@/lib/essays';

interface Prompt { id: string; set: string; claim: string }
const NONE: never[] = [];
const card = 'rounded-[var(--radius)] border border-line bg-surface p-5';

export function WritingHub({ prompts, instructions }: { prompts: Prompt[]; instructions: Record<string, string> }) {
  const router = useRouter();
  const essays = useLocalValue(ESSAYS_KEY, parseEssays, NONE);
  const [custom, setCustom] = useState('');
  const [customSet, setCustomSet] = useState('statement');
  const [filter, setFilter] = useState('all');
  const shown = prompts.filter((p) => filter === 'all' || p.set === filter);

  return (
    <div className="space-y-6">
      <section className={card}>
        <h2 className="text-lg font-bold">Practise a real topic</h2>
        <p className="mt-1 text-sm text-muted">The real test draws one Issue topic from ETS’s published pool. Pick one there, then paste it here with its instructions.</p>
        <a href="https://www.ets.org/pdfs/gre/issue-pool.pdf" target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-ink hover:underline">ETS Issue topic pool (PDF)<ExternalLink size={13} aria-hidden /></a>
        <label className="mt-4 block text-sm font-semibold" htmlFor="custom">Topic</label>
        <textarea id="custom" value={custom} onChange={(e) => setCustom(e.target.value)} rows={3} className="mt-1 w-full rounded-[var(--radius)] border border-line-strong bg-surface p-3 text-[15px]" placeholder="Paste the issue statement…" />
        <label className="mt-3 block text-sm font-semibold" htmlFor="cset">Instructions</label>
        <select id="cset" value={customSet} onChange={(e) => setCustomSet(e.target.value)} className="mt-1 h-11 w-full rounded-[var(--radius)] border border-line-strong bg-surface px-3 text-sm">
          {Object.entries(instructions).map(([k, v]) => <option key={k} value={k}>{v.slice(0, 80)}…</option>)}
        </select>
        <button disabled={custom.trim().length < 10} onClick={() => router.push(`/writing/session?custom=${encodeURIComponent(custom.trim())}&set=${customSet}`)} className="mt-4 inline-flex h-11 items-center gap-2 rounded-[var(--radius)] bg-accent px-5 text-sm font-bold text-accent-fg disabled:opacity-40"><PenLine size={16} aria-hidden />Start 30-minute essay</button>
      </section>

      <section>
        <h2 className="text-lg font-bold">Practice prompts</h2>
        <p className="text-sm text-muted">Original prompts in the style of the ETS tasks, one family per instruction set.</p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Instruction set">
          {['all', ...Object.keys(instructions)].map((k) => <button key={k} aria-pressed={filter === k} onClick={() => setFilter(k)} className={`min-h-[36px] rounded-full border px-3 text-xs font-semibold ${filter === k ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong bg-surface text-muted'}`}>{k === 'all' ? 'All' : k.replace('-', ' ')}</button>)}
        </div>
        <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[var(--radius)] border border-line bg-surface">
          {shown.map((p) => (
            <li key={p.id}><Link href={`/writing/session?prompt=${p.id}`} className="flex items-start gap-3 px-4 py-3 hover:bg-surface-2"><span className="mt-0.5 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-accent-ink">{p.set.replace('-', ' ')}</span><span className="text-sm">{p.claim}</span></Link></li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-bold">Your essays</h2>
        {essays.length === 0 ? <p className="mt-1 text-sm text-muted">Nothing yet.</p> : (
          <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[var(--radius)] border border-line bg-surface">
            {essays.map((e) => (
              <li key={e.id} className="px-4 py-3 text-sm"><p className="font-medium">{e.claim}</p>
                <p className="mt-0.5 text-xs text-faint">{new Date(e.ts).toLocaleDateString()} · {e.text.trim().split(/\s+/).filter(Boolean).length} words{e.selfScore !== undefined ? ` · self-check ${e.selfScore}` : ''}{e.ai ? ` · AI estimate ${e.ai.score}` : ''}</p></li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
