'use client';

import { Check, Circle } from 'lucide-react';
import { useAttempts } from '@/hooks/useAttempts';
import type { TopicView } from '@/content';
import { RichText } from '@/components/RichText';

/** What the lesson covers, each topic ticked once a question on it has been answered correctly. */
export function TopicChecklist({ topics }: { topics: TopicView[] }) {
  const attempts = useAttempts();
  const right = new Set(attempts.filter((a) => a.correct).map((a) => a.qid));
  const done = topics.filter((t) => t.questionIds.some((id) => right.has(id))).length;
  return (
    <details className="group rounded-[var(--radius)] border border-line bg-surface">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold">
        <span>Topics in this lesson</span>
        <span className="text-xs font-normal tabular-nums text-muted">{done}/{topics.length} practised</span>
      </summary>
      <ul className="divide-y divide-line border-t border-line text-[15px]">
        {topics.map((t) => {
          const ok = t.questionIds.some((id) => right.has(id));
          return (
            <li key={t.id} className="flex items-start gap-2.5 px-4 py-2.5">
              {ok
                ? <Check size={16} className="mt-1 shrink-0 text-good" aria-label="Practised" />
                : <Circle size={16} className="mt-1 shrink-0 text-faint" aria-label="Not practised yet" />}
              <span className="min-w-0 flex-1"><RichText inline>{t.title}</RichText></span>
              {t.scope && (
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${t.scope === 'official' ? 'bg-good-soft text-good' : 'bg-surface-2 text-muted'}`}
                  title={t.scope === 'official' ? `Stated or illustrated by ETS${t.etsRef ? ` (${t.etsRef})` : ''}` : 'Standard prep content derived from the ETS material; ETS does not state it'}
                >
                  {t.scope === 'official' ? 'ETS' : 'Extended'}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}
