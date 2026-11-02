'use client';

import { Fragment, type ReactNode } from 'react';
import { QC_CHOICES } from '@/types/questions';
import type {
  Answer,
  Exhibit,
  Expected,
  Passage,
  QuantItem,
  QuantSection,
  RCItem,
  SEItem,
  SimpleTable,
  TCItem,
  TextChoice,
  VerbalItem,
  VerbalSection,
} from '@/types/official';
import type { FigureTheme } from '@/lib/figure-theme';
import { FigureCard } from './ExamImage';
import { Markup } from './Markup';

/* One question, in the layout its type calls for.
 *
 * Used for taking the test (`onChange` set) and for reviewing it afterwards
 * (`onChange` absent, `review` carrying the key): the same markup either way,
 * so what you review is exactly what you were shown. */

export interface ReviewInfo {
  expected: Expected;
  correct: boolean;
  skipped: boolean;
}

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

const idsOf = (e: Expected | undefined): string[] =>
  e && (e.kind === 'ids' || e.kind === 'blanks') ? e.ids : [];

type ChoiceState = 'neutral' | 'correct' | 'wrong';

/* ── Choices ──────────────────────────────────────────────────────────── */

function TextChoiceButton({
  choice,
  multi,
  selected,
  state,
  locked,
  onClick,
}: {
  choice: TextChoice;
  multi: boolean;
  selected: boolean;
  state: ChoiceState;
  locked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locked}
      aria-pressed={selected}
      className={cx(
        'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-[15px] leading-snug transition-all duration-150',
        state === 'neutral' && selected && 'border-accent bg-accent-soft',
        state === 'neutral' && !selected && 'border-line bg-surface-2 hover:border-line-strong hover:bg-surface-2',
        state === 'correct' && 'border-good bg-good-soft',
        state === 'wrong' && 'border-bad bg-bad-soft',
        locked && 'cursor-default',
      )}
    >
      <span
        className={cx(
          'mt-px grid h-6 w-6 shrink-0 place-items-center border text-xs font-semibold',
          multi ? 'rounded-md' : 'rounded-full',
          state === 'correct' && 'border-good text-good',
          state === 'wrong' && 'border-bad text-bad',
          state === 'neutral' && selected && 'border-accent text-accent-ink',
          state === 'neutral' && !selected && 'border-line-strong text-faint',
        )}
      >
        {choice.id}
      </span>
      <span className="pt-0.5">
        <Markup text={choice.text} />
      </span>
    </button>
  );
}

/* ── Passage ──────────────────────────────────────────────────────────── */

/** The passage, optionally with every sentence clickable (select-in-passage). */
export function PassagePane({
  passage,
  selectable,
  selected,
  expected,
  onSelect,
}: {
  passage: Passage;
  selectable: boolean;
  selected?: number | null;
  /** Set when reviewing: the correct sentence number. */
  expected?: number;
  onSelect?: (n: number) => void;
}) {
  // Sentences are numbered across the whole passage, as the key counts them.
  const base: number[] = [];
  let seen = 0;
  for (const para of passage.sentences) {
    base.push(seen);
    seen += para.length;
  }
  return (
    <div className="space-y-3.5 text-[15.5px] leading-[1.7] text-fg/90">
      {passage.sentences.map((para, pi) => (
        <p key={pi}>
          {para.map((sentence, si) => {
            const n = base[pi] + si + 1;
            if (!selectable) {
              return (
                <Fragment key={si}>
                  <Markup text={sentence} />{' '}
                </Fragment>
              );
            }
            const isPicked = selected === n;
            const isKey = expected === n;
            return (
              <Fragment key={si}>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect?.(n)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelect?.(n);
                    }
                  }}
                  className={cx(
                    'cursor-pointer rounded px-0.5 transition-colors',
                    isKey && 'bg-good-soft ring-1 ring-emerald-400/60',
                    !isKey && isPicked && expected !== undefined && 'bg-bad-soft ring-1 ring-rose-400/60',
                    !isKey && isPicked && expected === undefined && 'bg-accent-soft ring-1 ring-accent',
                    !isKey && !isPicked && 'hover:bg-surface-2',
                  )}
                >
                  <Markup text={sentence} />
                </span>{' '}
              </Fragment>
            );
          })}
        </p>
      ))}
    </div>
  );
}

/* ── Verbal ───────────────────────────────────────────────────────────── */

function BlankChip({ children }: { children?: ReactNode }) {
  return (
    <span
      className={cx(
        'mx-1 inline-block min-w-[7rem] rounded-md px-2 py-0.5 text-center align-baseline',
        children
          ? 'border border-accent bg-accent-soft text-accent-ink'
          : 'border border-dashed border-line-strong bg-surface-2 text-faint',
      )}
    >
      {children ?? '———'}
    </span>
  );
}

function TCView({ item, answer, onChange, review }: { item: TCItem; answer?: Answer; onChange?: (a: Answer) => void; review?: ReviewInfo | null }) {
  const locked = !onChange;
  const picked = answer?.blanks ?? [];
  const expected = idsOf(review?.expected);
  const fills = item.blanks.map((b, i) => {
    const id = picked[i];
    const text = b.choices.find((c) => c.id === id)?.text;
    return <BlankChip key={i}>{text}</BlankChip>;
  });

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        {item.blanks.length > 1 ? 'For each blank, select one entry.' : 'Select one entry to complete the text.'}
      </p>
      <p className="text-[17px] leading-relaxed">
        <Markup text={item.text} blanks={fills} />
      </p>
      <div className={cx('grid gap-4', item.blanks.length > 1 && 'sm:grid-cols-2 lg:grid-cols-3')}>
        {item.blanks.map((blank, bi) => (
          <div key={blank.index} className="space-y-2">
            {item.blanks.length > 1 && (
              <p className="text-xs uppercase tracking-wide text-faint">Blank ({'i'.repeat(blank.index).replace('iiii', 'iv')})</p>
            )}
            {blank.choices.map((c) => {
              const selected = picked[bi] === c.id;
              const state: ChoiceState = !review ? 'neutral'
                : expected.includes(c.id) ? 'correct'
                : selected ? 'wrong' : 'neutral';
              return (
                <TextChoiceButton
                  key={c.id}
                  choice={c}
                  multi={false}
                  selected={selected}
                  state={state}
                  locked={locked}
                  onClick={() => {
                    const blanks = [...(answer?.blanks ?? Array(item.blanks.length).fill(null))];
                    blanks[bi] = blanks[bi] === c.id ? null : c.id;
                    onChange?.({ blanks });
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

function SEView({ item, answer, onChange, review }: { item: SEItem; answer?: Answer; onChange?: (a: Answer) => void; review?: ReviewInfo | null }) {
  const locked = !onChange;
  const picked = answer?.ids ?? [];
  const expected = idsOf(review?.expected);
  const preview = picked.map((id) => item.choices.find((c) => c.id === id)?.text).filter(Boolean).join(' / ');

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted">
        Select the two answer choices that, when used to complete the sentence, give it the same meaning.
      </p>
      <p className="text-[17px] leading-relaxed">
        <Markup text={item.text} blanks={[<BlankChip key="b">{preview || undefined}</BlankChip>]} />
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {item.choices.map((c) => {
          const selected = picked.includes(c.id);
          const state: ChoiceState = !review ? 'neutral'
            : expected.includes(c.id) ? 'correct'
            : selected ? 'wrong' : 'neutral';
          return (
            <TextChoiceButton
              key={c.id}
              choice={c}
              multi
              selected={selected}
              state={state}
              locked={locked}
              onClick={() => {
                // Capped at two: choosing a third drops the earliest pick.
                const ids = selected ? picked.filter((p) => p !== c.id) : [...picked, c.id].slice(-2);
                onChange?.({ ids });
              }}
            />
          );
        })}
      </div>
      <p className="text-xs text-faint">Exactly two answers — {picked.length}/2.</p>
    </div>
  );
}

function RCView({ item, answer, onChange, review }: { item: RCItem; answer?: Answer; onChange?: (a: Answer) => void; review?: ReviewInfo | null }) {
  const locked = !onChange;
  const multi = item.format === 'multi';
  const picked = answer?.ids ?? [];
  const expected = idsOf(review?.expected);

  return (
    <div className="space-y-5">
      <p className="text-[17px] leading-relaxed">
        <Markup text={item.stem} />
      </p>
      {item.format === 'sentence' ? (
        <p className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-muted">
          Click the sentence in the passage that answers the question.
          {answer?.sentence ? <span className="ml-1 text-accent-ink">Sentence {answer.sentence} selected.</span> : null}
        </p>
      ) : (
        <>
          {multi && (
            <p className="text-xs text-faint">Select all that apply — and no others.</p>
          )}
          <div className="space-y-2">
            {(item.choices ?? []).map((c) => {
              const selected = picked.includes(c.id);
              const state: ChoiceState = !review ? 'neutral'
                : expected.includes(c.id) ? 'correct'
                : selected ? 'wrong' : 'neutral';
              return (
                <TextChoiceButton
                  key={c.id}
                  choice={c}
                  multi={multi}
                  selected={selected}
                  state={state}
                  locked={locked}
                  onClick={() => {
                    if (multi) onChange?.({ ids: selected ? picked.filter((p) => p !== c.id) : [...picked, c.id] });
                    else onChange?.({ ids: [c.id] });
                  }}
                />
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Quantitative ─────────────────────────────────────────────────────── */

function NumericInput({
  value,
  onChange,
  locked,
  tone,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
  tone: 'neutral' | 'correct' | 'wrong';
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      inputMode="decimal"
      autoComplete="off"
      spellCheck={false}
      value={value}
      disabled={locked}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cx(
        'w-40 rounded-xl border bg-surface-2 px-4 py-3 text-lg outline-none',
        tone === 'neutral' && 'border-line focus:border-accent',
        tone === 'correct' && 'border-good',
        tone === 'wrong' && 'border-bad',
      )}
    />
  );
}

function formatExpected(e: Expected | undefined): string {
  if (!e) return '';
  if (e.kind === 'value') return String(e.value);
  if (e.kind === 'fraction') return `${e.num}/${e.den}`;
  return '';
}

export function TableView({ table, title }: { table: SimpleTable; title?: string }) {
  return (
    <figure className="max-w-full overflow-x-auto">
      {title && <figcaption className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{title}</figcaption>}
      <table className="exam-table">
        {table.head.some(Boolean) && (
          <thead>
            <tr>
              {table.head.map((h, i) => (
                <th key={i}>
                  <Markup text={h} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i}>
              {row.map((c, j) => (
                <td key={j}>
                  <Markup text={c} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** The figure shared by a group of questions (a graph and/or a table). */
export function ExhibitView({ exhibit, theme }: { exhibit: Exhibit; theme: FigureTheme }) {
  return (
    <div className="space-y-3">
      {exhibit.img && <FigureCard img={exhibit.img} theme={theme} />}
      {exhibit.table && <TableView table={exhibit.table} title={exhibit.title} />}
    </div>
  );
}

function QuantView({
  section,
  item,
  answer,
  onChange,
  review,
  theme,
  showExhibit,
}: {
  section: QuantSection;
  item: QuantItem;
  answer?: Answer;
  onChange?: (a: Answer) => void;
  review?: ReviewInfo | null;
  theme: FigureTheme;
  showExhibit: boolean;
}) {
  const locked = !onChange;
  const picked = answer?.ids ?? [];
  const expected = idsOf(review?.expected);
  const exhibit = item.exhibit ? section.exhibits[item.exhibit] : undefined;
  const stateOf = (id: string, selected: boolean): ChoiceState =>
    !review ? 'neutral' : expected.includes(id) ? 'correct' : selected ? 'wrong' : 'neutral';
  const multi = item.format === 'multi';
  const tone = review ? (review.correct ? 'correct' : 'wrong') : 'neutral';

  return (
    <div className="space-y-5">
      {showExhibit && exhibit && <ExhibitView exhibit={exhibit} theme={theme} />}

      <div className="space-y-5 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <p className="text-xs uppercase tracking-wide text-faint">Question {item.n}</p>

        {item.figure && <FigureCard img={item.figure} theme={theme} />}
        {item.table && <TableView table={item.table} />}

        {item.common && (
          <p className={cx('text-[17px] leading-relaxed', /^\$[^$]+\$( <br> \$[^$]+\$)?$/.test(item.common) && 'text-center')}>
            <Markup text={item.common} />
          </p>
        )}

        {item.type === 'QC' && (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              {([['A', item.a], ['B', item.b]] as const).map(([side, text]) => (
                <div key={side} className="rounded-xl border border-line bg-surface-2 px-4 py-4">
                  <p className="mb-2 text-xs uppercase tracking-wide text-faint">Quantity {side}</p>
                  <p className="text-lg font-medium">
                    <Markup text={text ?? ''} />
                  </p>
                </div>
              ))}
            </div>
            <div className="space-y-2" role="radiogroup">
              {QC_CHOICES.map((c) => {
                const selected = picked[0] === c.id;
                return (
                  <TextChoiceButton
                    key={c.id}
                    choice={c}
                    multi={false}
                    selected={selected}
                    state={stateOf(c.id, selected)}
                    locked={locked}
                    onClick={() => onChange?.({ ids: [c.id] })}
                  />
                );
              })}
            </div>
          </>
        )}

        {item.type !== 'QC' && item.stem && (
          <p className="text-[17px] leading-relaxed">
            <Markup text={item.stem} />
          </p>
        )}

        {item.type === 'PS' && (
          <>
            {multi && (
              <p className="text-xs text-faint">Select all that apply — and no others.</p>
            )}
            <div className="space-y-2" role={multi ? 'group' : 'radiogroup'}>
              {(item.choices ?? []).map((c) => {
                const selected = picked.includes(c.id);
                return (
                  <TextChoiceButton
                    key={c.id}
                    choice={c}
                    multi={multi}
                    selected={selected}
                    state={stateOf(c.id, selected)}
                    locked={locked}
                    onClick={() => {
                      if (multi) onChange?.({ ids: selected ? picked.filter((p) => p !== c.id) : [...picked, c.id] });
                      else onChange?.({ ids: [c.id] });
                    }}
                  />
                );
              })}
            </div>
          </>
        )}

        {item.type === 'NE' && (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              {item.label && (
                <span className="text-lg">
                  <Markup text={item.label} />
                </span>
              )}
              {item.format === 'fraction' ? (
                <div className="inline-flex flex-col items-center gap-1.5">
                  <NumericInput
                    value={answer?.num ?? ''}
                    onChange={(v) => onChange?.({ ...answer, num: v })}
                    locked={locked}
                    tone={tone}
                    placeholder="numerator"
                  />
                  <span className="h-0.5 w-40 bg-line-strong" />
                  <NumericInput
                    value={answer?.den ?? ''}
                    onChange={(v) => onChange?.({ ...answer, den: v })}
                    locked={locked}
                    tone={tone}
                    placeholder="denominator"
                  />
                </div>
              ) : (
                <>
                  <NumericInput
                    value={answer?.text ?? ''}
                    onChange={(v) => onChange?.({ text: v })}
                    locked={locked}
                    tone={tone}
                    placeholder="Your answer"
                  />
                  {item.unit && <span className="text-lg">{item.unit}</span>}
                </>
              )}
            </div>
            <p className="text-xs text-faint">
              {item.format === 'fraction'
                ? 'Enter an integer in each box; equivalent fractions are accepted.'
                : 'An integer or a decimal (may be negative). 2.5 and 2.50 are equivalent.'}
            </p>
            {review && !review.correct && (
              <p className="text-sm font-medium text-good">Correct answer: {formatExpected(review.expected)}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Entry point ──────────────────────────────────────────────────────── */

export function ItemBody({
  section,
  item,
  answer,
  onChange,
  review,
  theme,
  showExhibit = true,
}: {
  section: VerbalSection | QuantSection;
  item: VerbalItem | QuantItem;
  answer?: Answer;
  onChange?: (a: Answer) => void;
  review?: ReviewInfo | null;
  theme: FigureTheme;
  /** Off when a two-pane layout already shows the exhibit beside the question. */
  showExhibit?: boolean;
}) {
  if (section.kind === 'quant') {
    return (
      <QuantView
        section={section}
        item={item as QuantItem}
        answer={answer}
        onChange={onChange}
        review={review}
        theme={theme}
        showExhibit={showExhibit}
      />
    );
  }
  const v = item as VerbalItem;
  if (v.type === 'TC') return <TCView item={v} answer={answer} onChange={onChange} review={review} />;
  if (v.type === 'SE') return <SEView item={v} answer={answer} onChange={onChange} review={review} />;
  return <RCView item={v} answer={answer} onChange={onChange} review={review} />;
}
