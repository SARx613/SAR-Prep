'use client';

import { splitSentences } from '@/lib/sentences';
import { RichText } from '@/components/RichText';
import type { PassageSpec } from '@/content/schema';

/* The RC passage. For select-in-passage the sentences of the allowed
 * paragraph become clickable, as on the real test: only the paragraph the
 * question names can be picked from. */

interface Props {
  passage: PassageSpec;
  selectable?: boolean;
  paragraphIndex?: number;
  selected?: string;
  onPick?: (sentence: string) => void;
  locked?: boolean;
  /** Painted green once the answer is revealed. */
  correctSentence?: string;
}

export function PassagePane({ passage, selectable, paragraphIndex, selected, onPick, locked, correctSentence }: Props) {
  return (
    <article className="prose-sar" aria-label="Reading passage">
      {passage.title && <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted">{passage.title}</h3>}
      {passage.paragraphs.map((para, pi) => {
        const live = selectable && (paragraphIndex === undefined || paragraphIndex === pi);
        return (
          <p key={pi} className={`${pi > 0 ? 'mt-4' : ''} ${live ? 'border-l-4 border-accent pl-3' : ''}`}>
            {live
              ? splitSentences(para).map((s, si) => {
                  const isSel = selected === s;
                  const isKey = locked && correctSentence === s;
                  return (
                    <span key={si}>
                      <span
                        role="button"
                        tabIndex={locked ? -1 : 0}
                        aria-pressed={isSel}
                        onClick={() => !locked && onPick?.(s)}
                        onKeyDown={(e) => {
                          if (!locked && (e.key === 'Enter' || e.key === ' ')) {
                            e.preventDefault();
                            onPick?.(s);
                          }
                        }}
                        className={`cursor-pointer rounded-sm px-0.5 transition-colors ${
                          isKey ? 'bg-good-soft underline decoration-good' : isSel ? (locked ? 'bg-bad-soft' : 'bg-accent-soft underline decoration-accent') : 'hover:bg-surface-2'
                        }`}
                      >
                        <RichText inline>{s}</RichText>
                      </span>{' '}
                    </span>
                  );
                })
              : <RichText inline>{para}</RichText>}
          </p>
        );
      })}
    </article>
  );
}
