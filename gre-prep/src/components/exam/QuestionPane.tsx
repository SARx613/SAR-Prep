'use client';

import { useId } from 'react';
import { RichText } from '@/components/RichText';
import { QC_CHOICES } from '@/types/questions';
import type { Choice, QCContent, SEContent, TCContent } from '@/types/questions';
import type { Grade } from '@/lib/grading';
import type { ClientQuestion } from '@/content/types';
import {
  ROMAN,
  choicesOf,
  emptySelection,
  formatOf,
  isSingle,
  numericFormat,
  type Selection,
} from './selection';

/* One question in the layout its GRE type calls for.
 *
 * The real test shows choices as bare ovals (select one) or squares (select
 * all) with no A–E labels; letters appear here only in review, where the
 * explanations refer to them. */

interface Props {
  q: ClientQuestion;
  sel: Selection;
  onChange: (next: Selection) => void;
  locked?: boolean;
  /** Painted after grading: key vs. the learner's pick. */
  grade?: Grade | null;
  showLetters?: boolean;
}

type State = 'neutral' | 'key' | 'wrong' | 'missed';

function ChoiceRow({
  name,
  choice,
  type,
  checked,
  state,
  disabled,
  letter,
  onToggle,
}: {
  name: string;
  choice: Choice;
  type: 'radio' | 'checkbox';
  checked: boolean;
  state: State;
  disabled: boolean;
  letter?: string;
  onToggle: () => void;
}) {
  const tone =
    state === 'key' ? 'border-good bg-good-soft'
    : state === 'wrong' ? 'border-bad bg-bad-soft'
    : state === 'missed' ? 'border-good border-dashed'
    : checked ? 'border-accent bg-accent-soft'
    : 'border-line hover:border-line-strong hover:bg-surface-2';
  return (
    <label
      className={`flex min-h-[48px] cursor-pointer items-start gap-3 rounded-[var(--radius)] border px-3.5 py-3 text-[15px] leading-snug transition-colors ${tone} ${disabled ? 'cursor-default' : ''}`}
    >
      <input
        type={type}
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={onToggle}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center border-2 text-[10px] font-bold ${type === 'radio' ? 'rounded-full' : 'rounded-[4px]'} ${
          checked ? 'border-accent bg-accent text-accent-fg' : state === 'missed' || state === 'key' ? 'border-good' : 'border-line-strong'
        } peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--focus)]`}
      >
        {checked ? (type === 'radio' ? <span className="h-2 w-2 rounded-full bg-accent-fg" /> : '✓') : ''}
      </span>
      {letter && <span className="mt-px w-4 shrink-0 text-xs font-bold text-faint">{letter}</span>}
      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
        <RichText inline>{choice.text}</RichText>
      </span>
      {state === 'key' && <span className="shrink-0 text-xs font-bold text-good">Correct</span>}
      {state === 'missed' && <span className="shrink-0 text-xs font-bold text-good">Answer</span>}
    </label>
  );
}

/** Sentence text with {{n}} markers shown as blanks (filled when chosen). */
function BlankedText({ text, fills, multi }: { text: string; fills: (string | null)[]; multi: boolean }) {
  const parts = text.split(/(\{\{\d\}\})/g);
  return (
    <p className="text-[17px] leading-[1.9] text-fg">
      {parts.map((part, i) => {
        const m = part.match(/^\{\{(\d)\}\}$/);
        if (!m) return <RichText key={i} inline>{part}</RichText>;
        const idx = Number(m[1]) - 1;
        const filled = fills[idx];
        return (
          <span
            key={i}
            className={`mx-1 inline-block min-w-[6.5rem] border-b-2 px-2 text-center align-baseline ${
              filled ? 'border-accent font-semibold text-accent' : 'border-line-strong text-faint'
            }`}
          >
            {filled ? <RichText inline>{filled}</RichText> : multi ? `(${ROMAN[idx]})` : ' '}
          </span>
        );
      })}
    </p>
  );
}

function NumericEntry({ q, sel, onChange, locked, grade }: Props) {
  const f = numericFormat(q);
  const unit = (q.content as { unit?: string; numeric?: { unit?: string } }).unit ?? (q.content as { numeric?: { unit?: string } }).numeric?.unit;
  const id = useId();
  const box = 'h-12 rounded-[var(--radius)] border border-line-strong bg-surface px-3 text-center text-lg tabular-nums text-fg focus:border-accent';
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">
        {f === 'fraction' ? 'Enter your answer as a fraction in the two boxes.' : 'Enter your answer in the box.'}
      </p>
      <div className="flex items-center gap-3">
        {f === 'fraction' ? (
          <div className="inline-flex flex-col items-stretch gap-1.5">
            <input
              aria-label="Numerator"
              inputMode="numeric"
              autoComplete="off"
              disabled={locked}
              value={sel.numerator}
              onChange={(e) => onChange({ ...sel, numerator: e.target.value.replace(/[^\d-]/g, '') })}
              className={`${box} w-28`}
            />
            <div className="h-0.5 bg-fg" aria-hidden />
            <input
              aria-label="Denominator"
              inputMode="numeric"
              autoComplete="off"
              disabled={locked}
              value={sel.denominator}
              onChange={(e) => onChange({ ...sel, denominator: e.target.value.replace(/[^\d-]/g, '') })}
              className={`${box} w-28`}
            />
          </div>
        ) : (
          <input
            id={id}
            aria-label="Answer"
            inputMode="decimal"
            autoComplete="off"
            disabled={locked}
            value={sel.numeric}
            onChange={(e) => onChange({ ...sel, numeric: e.target.value.replace(/[^\d.\-]/g, '') })}
            className={`${box} w-44`}
          />
        )}
        {unit && <span className="text-muted">{unit}</span>}
      </div>
      {grade && !grade.isCorrect && <p className="text-sm font-semibold text-good">Answer: {grade.expected[0]}</p>}
    </div>
  );
}

function ChoiceList({ q, sel, onChange, locked, grade, showLetters }: Props) {
  const name = useId();
  const single = isSingle(q);
  const choices = choicesOf(q);
  const keys = grade?.expected ?? [];
  return (
    <div role={single ? 'radiogroup' : 'group'} aria-label="Answer choices" className={q.type === 'SE' ? 'grid gap-2 sm:grid-cols-2' : 'grid gap-2'}>
      {choices.map((c, i) => {
        const checked = sel.ids.includes(c.id);
        const state: State = !grade ? 'neutral'
          : keys.includes(c.id) ? (checked ? 'key' : 'missed')
          : checked ? 'wrong' : 'neutral';
        return (
          <ChoiceRow
            key={c.id}
            name={name}
            choice={c}
            type={single ? 'radio' : 'checkbox'}
            checked={checked}
            state={state}
            disabled={!!locked}
            letter={showLetters ? 'ABCDEF'[i] : undefined}
            onToggle={() => {
              if (single) return onChange({ ...sel, ids: [c.id] });
              const cap = q.type === 'SE' ? 2 : choices.length;
              const has = sel.ids.includes(c.id);
              if (!has && sel.ids.length >= cap) return;
              onChange({ ...sel, ids: has ? sel.ids.filter((x) => x !== c.id) : [...sel.ids, c.id] });
            }}
          />
        );
      })}
    </div>
  );
}

export function QuestionPane(props: Props) {
  const { q, sel, onChange, locked, grade, showLetters } = props;

  /* Text Completion ─────────────────────────────────────────────────────── */
  if (q.type === 'TC') {
    const content = q.content as TCContent;
    const multi = content.blanks.length > 1;
    const fills = content.blanks.map((b, i) => b.choices.find((c) => c.id === sel.blanks[i])?.text ?? null);
    return (
      <div className="space-y-5">
        <p className="text-sm text-muted"><RichText inline>{q.stem}</RichText></p>
        <BlankedText text={content.text} fills={fills} multi={multi} />
        <div className={multi ? 'grid gap-5 md:grid-cols-3' : ''}>
          {content.blanks.map((blank, bi) => (
            <fieldset key={blank.index} className="min-w-0 space-y-2">
              {multi && <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">Blank ({ROMAN[bi]})</legend>}
              <div role="radiogroup" aria-label={multi ? `Blank ${ROMAN[bi]}` : 'Answer choices'} className="grid gap-2">
                {blank.choices.map((c, ci) => {
                  const checked = sel.blanks[bi] === c.id;
                  const isKey = grade?.expected[bi] === c.id;
                  const state: State = !grade ? 'neutral' : isKey ? (checked ? 'key' : 'missed') : checked ? 'wrong' : 'neutral';
                  return (
                    <ChoiceRow
                      key={c.id}
                      name={`${q.id}-b${bi}`}
                      choice={c}
                      type="radio"
                      checked={checked}
                      state={state}
                      disabled={!!locked}
                      letter={showLetters ? 'ABCDE'[ci] : undefined}
                      onToggle={() => {
                        const blanks = [...sel.blanks];
                        blanks[bi] = c.id;
                        onChange({ ...sel, blanks });
                      }}
                    />
                  );
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </div>
    );
  }

  /* Sentence Equivalence ────────────────────────────────────────────────── */
  if (q.type === 'SE') {
    const content = q.content as SEContent;
    return (
      <div className="space-y-5">
        <p className="text-sm text-muted"><RichText inline>{q.stem}</RichText></p>
        <BlankedText text={content.text} fills={[null]} multi={false} />
        <p className="text-sm text-muted">Select exactly two answers ({sel.ids.length}/2).</p>
        <ChoiceList {...props} />
      </div>
    );
  }

  /* Quantitative Comparison ─────────────────────────────────────────────── */
  if (q.type === 'QC') {
    const c = q.content as QCContent;
    return (
      <div className="space-y-5">
        <p className="text-sm text-muted"><RichText inline>{q.stem}</RichText></p>
        {c.common && (
          <div className="mx-auto max-w-xl text-center text-[16px]"><RichText>{c.common}</RichText></div>
        )}
        <div className="grid grid-cols-2 gap-3">
          {([['Quantity A', c.quantityA], ['Quantity B', c.quantityB]] as const).map(([label, body]) => (
            <div key={label} className="min-w-0 rounded-[var(--radius)] border border-line-strong bg-surface p-3 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-muted">{label}</p>
              <div className="text-[17px] [overflow-wrap:anywhere]"><RichText inline>{body}</RichText></div>
            </div>
          ))}
        </div>
        <ChoiceList {...props} />
      </div>
    );
  }

  /* Numeric Entry, DI numeric ───────────────────────────────────────────── */
  if (numericFormat(q)) {
    return (
      <div className="space-y-5">
        <RichText>{q.stem}</RichText>
        <NumericEntry {...props} />
      </div>
    );
  }

  /* Select-in-passage: the click happens in the passage ─────────────────── */
  if (q.type === 'RC' && formatOf(q) === 'select_in_passage') {
    return (
      <div className="space-y-4">
        <RichText>{q.stem}</RichText>
        <p className="text-sm text-muted">Select a sentence in the passage by clicking or tapping it.</p>
        <div className="min-h-[3rem] rounded-[var(--radius)] border border-dashed border-line-strong p-3 text-sm">
          {sel.sentence ? <RichText inline>{sel.sentence}</RichText> : <span className="text-faint">No sentence selected yet.</span>}
        </div>
        {grade && !grade.isCorrect && <p className="text-sm text-good"><span className="font-semibold">Answer: </span>{grade.expected[0]}</p>}
      </div>
    );
  }

  /* PS, RC and DI choice items ──────────────────────────────────────────── */
  const hint = isSingle(q) ? null : formatOf(q) === 'select_all' ? 'Select all that apply.' : null;
  return (
    <div className="space-y-5">
      <RichText>{q.stem}</RichText>
      {hint && <p className="text-sm text-muted">{hint}</p>}
      <ChoiceList q={q} sel={sel} onChange={onChange} locked={locked} grade={grade} showLetters={showLetters} />
    </div>
  );
}

export { emptySelection, QC_CHOICES };
