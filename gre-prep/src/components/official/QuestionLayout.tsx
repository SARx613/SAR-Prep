'use client';

import type { Answer, QuantItem, RCItem, VerbalItem, QuantSection, VerbalSection } from '@/types/official';
import type { FigureTheme } from '@/lib/figure-theme';
import { ExhibitView, ItemBody, PassagePane, type ReviewInfo } from './ItemView';

/* Lays a question out with whatever it needs beside it: the passage of a
 * reading question, or the figure a group of quantitative questions share.
 * Shared by the test (live) and the review (read-only, `review` set). */

export function QuestionLayout({
  section,
  item,
  answer,
  theme,
  onChange,
  review,
  sticky = true,
}: {
  section: VerbalSection | QuantSection;
  item: VerbalItem | QuantItem;
  answer: Answer | undefined;
  theme: FigureTheme;
  onChange?: (a: Answer) => void;
  review?: ReviewInfo | null;
  /** The live test sits under a sticky header; the review page does not. */
  sticky?: boolean;
}) {
  const top = sticky ? 'lg:top-32 xl:top-32' : 'lg:top-4 xl:top-4';
  const passage =
    section.kind === 'verbal' && (item as VerbalItem).type === 'RC'
      ? section.passages.find((p) => p.id === (item as RCItem).passageId)
      : undefined;
  const exhibit =
    section.kind === 'quant' && (item as QuantItem).exhibit
      ? section.exhibits[(item as QuantItem).exhibit as string]
      : undefined;
  const sentenceMode = !!passage && (item as RCItem).format === 'sentence';

  if (passage) {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        <div
          className={`rounded-2xl border border-line bg-surface p-5 lg:sticky lg:max-h-[calc(100vh-9rem)] lg:overflow-y-auto ${top}`}
        >
          <PassagePane
            passage={passage}
            selectable={sentenceMode}
            selected={answer?.sentence}
            expected={review?.expected.kind === 'sentence' ? review.expected.n : undefined}
            onSelect={onChange ? (n) => onChange({ sentence: n }) : undefined}
          />
        </div>
        <div className="rounded-2xl border border-line bg-surface p-5">
          <p className="mb-4 text-xs uppercase tracking-wide text-faint">Question {item.n}</p>
          <ItemBody section={section} item={item} answer={answer} onChange={onChange} review={review} theme={theme} />
        </div>
      </div>
    );
  }

  if (exhibit) {
    return (
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <div className={`rounded-2xl border border-line bg-surface p-5 lg:sticky ${top}`}>
          <ExhibitView exhibit={exhibit} theme={theme} />
        </div>
        <ItemBody
          section={section}
          item={item}
          answer={answer}
          onChange={onChange}
          review={review}
          theme={theme}
          showExhibit={false}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {section.kind === 'verbal' ? (
        <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <ItemBody section={section} item={item} answer={answer} onChange={onChange} review={review} theme={theme} />
        </div>
      ) : (
        // The quantitative view draws its own card.
        <ItemBody section={section} item={item} answer={answer} onChange={onChange} review={review} theme={theme} />
      )}
    </div>
  );
}
