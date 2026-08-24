'use client';

import { useMemo } from 'react';
import { QC_CHOICES } from '@/types/questions';
import type {
  Choice,
  Figure,
  Passage,
  QCContent,
  RCContent,
  SEContent,
  TCContent,
} from '@/types/questions';
import type { ClientQuestion } from '@/app/actions/practice';
import { FigureView } from './FigureView';

/* Renders one question in the layout its type calls for.
 *
 * Selection state is owned by the parent so the whole item is graded at
 * once — the GRE gives no partial credit, so a single blank is never
 * scored on its own. */

export interface Selection {
  /** Choice ids, for everything except TC and NE. */
  ids: string[];
  /** One id per blank, for TC. */
  blanks: (string | null)[];
  /** For NE. */
  numeric: string;
  /** For select-in-passage. */
  sentence: string;
}

export const emptySelection = (blanks = 1): Selection => ({
  ids: [],
  blanks: Array(blanks).fill(null),
  numeric: '',
  sentence: '',
});

interface Props {
  question: ClientQuestion;
  passage?: Passage;
  figure?: Figure;
  selection: Selection;
  onSelect: (next: Selection) => void;
  /** Set once answered; locks input and paints the key. */
  revealed?: { isCorrect: boolean; expected: string[] } | null;
}

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ');

function ChoiceButton({
  choice,
  selected,
  state,
  onClick,
  disabled,
  multi,
}: {
  choice: Choice;
  selected: boolean;
  state: 'neutral' | 'correct' | 'wrong';
  onClick: () => void;
  disabled: boolean;
  multi: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cx(
        'w-full text-left px-4 py-3 rounded-xl border transition-all duration-150',
        'flex items-start gap-3 text-[15px] leading-snug',
        state === 'neutral' && selected && 'border-violet-400/70 bg-violet-500/10',
        state === 'neutral' &&
          !selected &&
          'border-white/10 bg-white/[0.02] hover:border-white/25 hover:bg-white/[0.05]',
        state === 'correct' && 'border-emerald-400/70 bg-emerald-500/12',
        state === 'wrong' && 'border-rose-400/70 bg-rose-500/12',
        disabled && 'cursor-default'
      )}
    >
      <span
        className={cx(
          'shrink-0 w-6 h-6 grid place-items-center text-xs font-semibold mt-px border',
          multi ? 'rounded-md' : 'rounded-full',
          state === 'correct' && 'border-emerald-400 text-emerald-300',
          state === 'wrong' && 'border-rose-400 text-rose-300',
          state === 'neutral' && selected && 'border-violet-400 text-violet-200',
          state === 'neutral' && !selected && 'border-white/20 text-white/40'
        )}
      >
        {choice.id.replace(/^\d/, '')}
      </span>
      <span className="pt-0.5">{choice.text}</span>
    </button>
  );
}

/** Renders sentence text with {{n}} markers replaced by inline blanks. */
function BlankedText({ text, fills }: { text: string; fills: (string | null)[] }) {
  const parts = useMemo(() => text.split(/(\{\{\d\}\})/g), [text]);
  return (
    <p className="text-[17px] leading-relaxed text-[var(--text-primary)]">
      {parts.map((part, i) => {
        const m = part.match(/^\{\{(\d)\}\}$/);
        if (!m) return <span key={i}>{part}</span>;
        const idx = Number(m[1]) - 1;
        const filled = fills[idx];
        return (
          <span
            key={i}
            className={cx(
              'inline-block min-w-[7rem] mx-1 px-2 py-0.5 rounded-md text-center align-baseline',
              filled
                ? 'bg-violet-500/15 text-violet-100 border border-violet-400/40'
                : 'bg-white/[0.04] border border-dashed border-white/25 text-white/30'
            )}
          >
            {/* An unfilled blank shows a rule, as the exam does, rather
                than a word — the sentence is English and a French label
                inside it reads as part of the text. */}
            {filled ?? '\u2014\u2014\u2014'}
          </span>
        );
      })}
    </p>
  );
}

export function QuestionView({
  question,
  passage,
  figure,
  selection,
  onSelect,
  revealed,
}: Props) {
  const locked = !!revealed;

  const stateFor = (id: string): 'neutral' | 'correct' | 'wrong' => {
    if (!revealed) return 'neutral';
    if (revealed.expected.includes(id)) return 'correct';
    if (selection.ids.includes(id) || selection.blanks.includes(id)) return 'wrong';
    return 'neutral';
  };

  /* ── Text Completion ────────────────────────────────────────────────── */
  if (question.type === 'TC') {
    const content = question.content as TCContent;
    const fillText = content.blanks.map((b, i) => {
      const id = selection.blanks[i];
      return b.choices.find((c) => c.id === id)?.text ?? null;
    });

    return (
      <div className="space-y-6">
        <p className="text-sm text-[var(--text-secondary)]">{question.stem}</p>
        <BlankedText text={content.text} fills={fillText} />
        <div
          className={cx(
            'grid gap-4',
            content.blanks.length > 1 && 'sm:grid-cols-2 lg:grid-cols-3'
          )}
        >
          {content.blanks.map((blank, bi) => (
            <div key={blank.index} className="space-y-2">
              {content.blanks.length > 1 && (
                <p className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
                  Blanc {blank.index}
                </p>
              )}
              {blank.choices.map((c) => (
                <ChoiceButton
                  key={c.id}
                  choice={c}
                  multi={false}
                  selected={selection.blanks[bi] === c.id}
                  state={stateFor(c.id)}
                  disabled={locked}
                  onClick={() => {
                    const blanks = [...selection.blanks];
                    blanks[bi] = blanks[bi] === c.id ? null : c.id;
                    onSelect({ ...selection, blanks });
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Sentence Equivalence ───────────────────────────────────────────── */
  if (question.type === 'SE') {
    const content = question.content as SEContent;
    const picked = selection.ids;
    const preview = picked
      .map((id) => content.choices.find((c) => c.id === id)?.text)
      .filter(Boolean)
      .join(' / ');

    return (
      <div className="space-y-6">
        <p className="text-sm text-[var(--text-secondary)]">{question.stem}</p>
        <BlankedText text={content.text} fills={[preview || null]} />
        <div className="grid sm:grid-cols-2 gap-2">
          {content.choices.map((c) => (
            <ChoiceButton
              key={c.id}
              choice={c}
              multi
              selected={picked.includes(c.id)}
              state={stateFor(c.id)}
              disabled={locked}
              onClick={() => {
                const has = picked.includes(c.id);
                // Capped at two: choosing a third drops the earliest pick.
                const ids = has
                  ? picked.filter((p) => p !== c.id)
                  : [...picked, c.id].slice(-2);
                onSelect({ ...selection, ids });
              }}
            />
          ))}
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          Sélectionne exactement deux réponses — {picked.length}/2.
        </p>
      </div>
    );
  }

  /* ── Quantitative Comparison ────────────────────────────────────────── */
  if (question.type === 'QC') {
    const content = question.content as QCContent;
    return (
      <div className="space-y-5">
        {content.common && (
          <div className="px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-[15px]">
            {content.common}
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          {(['A', 'B'] as const).map((side) => (
            <div
              key={side}
              className="px-4 py-4 rounded-xl bg-white/[0.02] border border-white/10"
            >
              <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-2">
                Quantity {side}
              </p>
              <p className="text-lg font-medium">
                {side === 'A' ? content.quantityA : content.quantityB}
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          {QC_CHOICES.map((c) => (
            <ChoiceButton
              key={c.id}
              choice={c}
              multi={false}
              selected={selection.ids[0] === c.id}
              state={stateFor(c.id)}
              disabled={locked}
              onClick={() => onSelect({ ...selection, ids: [c.id] })}
            />
          ))}
        </div>
      </div>
    );
  }

  /* ── Numeric Entry ──────────────────────────────────────────────────── */
  if (question.type === 'NE') {
    return (
      <div className="space-y-5">
        <p className="text-[17px] leading-relaxed">{question.stem}</p>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            inputMode="decimal"
            value={selection.numeric}
            disabled={locked}
            onChange={(e) => onSelect({ ...selection, numeric: e.target.value })}
            placeholder="Ta réponse"
            className={cx(
              'w-44 px-4 py-3 rounded-xl bg-white/[0.03] border text-lg outline-none',
              'focus:border-violet-400/60',
              revealed
                ? revealed.isCorrect
                  ? 'border-emerald-400/70'
                  : 'border-rose-400/70'
                : 'border-white/12'
            )}
          />
          {revealed && !revealed.isCorrect && (
            <span className="text-sm text-emerald-300">
              Réponse : {revealed.expected[0]}
            </span>
          )}
        </div>
      </div>
    );
  }

  /* ── Reading / Problem Solving / Data Interpretation ────────────────── */
  const content = question.content as RCContent & { choices?: Choice[] };
  const multi = content.format === 'select_all';

  return (
    <div className="space-y-5">
      {passage && (
        <div className="px-4 py-4 rounded-xl bg-white/[0.02] border border-white/10 max-h-[42vh] overflow-y-auto">
          {passage.title && (
            <p className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-2">
              {passage.title}
            </p>
          )}
          {passage.body.split('\n\n').map((para, i) => (
            <p key={i} className="text-[15px] leading-relaxed mb-3 last:mb-0">
              {para}
            </p>
          ))}
        </div>
      )}

      {figure && <FigureView figure={figure} />}

      <p className="text-[17px] leading-relaxed">{question.stem}</p>

      {content.format === 'select_in_passage' ? (
        <div className="space-y-2">
          <p className="text-xs text-[var(--text-muted)]">
            Trouve la phrase du passage qui répond à la question, puis saisis ses
            premiers mots.
          </p>
          <input
            type="text"
            value={selection.sentence}
            disabled={locked}
            onChange={(e) => onSelect({ ...selection, sentence: e.target.value })}
            placeholder="Premiers mots de la phrase…"
            className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/12 outline-none focus:border-violet-400/60"
          />
          {revealed && (
            <p className="text-sm text-emerald-300 leading-relaxed">
              {revealed.expected[0]}
            </p>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {(content.choices ?? []).map((c) => (
              <ChoiceButton
                key={c.id}
                choice={c}
                multi={multi}
                selected={selection.ids.includes(c.id)}
                state={stateFor(c.id)}
                disabled={locked}
                onClick={() => {
                  if (multi) {
                    const has = selection.ids.includes(c.id);
                    onSelect({
                      ...selection,
                      ids: has
                        ? selection.ids.filter((p) => p !== c.id)
                        : [...selection.ids, c.id],
                    });
                  } else {
                    onSelect({ ...selection, ids: [c.id] });
                  }
                }}
              />
            ))}
          </div>
          {multi && (
            <p className="text-xs text-[var(--text-muted)]">
              Sélectionne toutes les bonnes réponses — et aucune autre.
            </p>
          )}
        </>
      )}
    </div>
  );
}
