'use client';

import { CheckCircle2, XCircle } from 'lucide-react';
import { RichText } from '@/components/RichText';
import type { Grade } from '@/lib/grading';
import type { ClientQuestion } from '@/content/types';
import { choicesOf } from './selection';

/* After an answer (tutor mode, lesson checks, results review): verdict, the
 * shortest correct route, and why each wrong choice fails. */

export function Feedback({ q, grade, ms }: { q: ClientQuestion; grade: Grade; ms?: number }) {
  const label = new Map<string, string>();
  const lists = q.type === 'TC' ? (q.content as { blanks: { choices: { id: string; text: string }[] }[] }).blanks.map((b) => b.choices) : [choicesOf(q)];
  lists.flat().forEach((c) => label.set(c.id, c.text));

  const wrong = Object.entries(q.choiceExplanations ?? {});
  const secs = ms !== undefined ? Math.round(ms / 1000) : null;

  return (
    <section aria-live="polite" className={`rounded-[var(--radius)] border p-4 ${grade.isCorrect ? 'border-good/50 bg-good-soft' : 'border-bad/50 bg-bad-soft'}`}>
      <p className={`flex items-center gap-2 text-sm font-bold ${grade.isCorrect ? 'text-good' : 'text-bad'}`}>
        {grade.isCorrect ? <CheckCircle2 size={18} aria-hidden /> : <XCircle size={18} aria-hidden />}
        {grade.incomplete ? 'No answer' : grade.isCorrect ? 'Correct' : 'Not quite'}
        {secs !== null && (
          <span className="ml-auto text-xs font-medium text-muted">
            {secs}s · target {q.estSeconds}s
          </span>
        )}
      </p>
      <div className="mt-2 text-sm text-fg">
        <RichText>{q.explanation ?? ""}</RichText>
      </div>
      {wrong.length > 0 && !grade.isCorrect && (
        <ul className="mt-3 space-y-1.5 border-t border-line pt-3 text-sm text-muted">
          {wrong.map(([id, why]) => (
            <li key={id} className="flex gap-2">
              <span className="shrink-0 font-semibold text-fg">{label.has(id) ? <RichText inline>{label.get(id)!}</RichText> : id}:</span>
              <RichText inline>{why}</RichText>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
