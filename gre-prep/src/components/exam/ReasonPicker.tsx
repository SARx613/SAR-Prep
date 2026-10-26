'use client';

import { useReasons } from '@/hooks/usePrefs';
import { REASON_LABEL, setReason, type ErrorReason } from '@/lib/prefs';

/* One tap after a miss: why? Feeds the error log and the stats breakdown. */
export function ReasonPicker({ qid }: { qid: string }) {
  const reasons = useReasons();
  const chosen = reasons[qid];
  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="text-xs font-semibold text-muted">Why did you miss it?</p>
      <div className="mt-2 flex flex-wrap gap-2" role="radiogroup" aria-label="Reason for the miss">
        {(Object.keys(REASON_LABEL) as ErrorReason[]).map((r) => (
          <button
            key={r}
            type="button"
            role="radio"
            aria-checked={chosen === r}
            onClick={() => setReason(qid, chosen === r ? null : r)}
            className={`min-h-[36px] rounded-full border px-3 text-xs font-semibold ${chosen === r ? 'border-accent bg-accent text-accent-fg' : 'border-line-strong bg-surface text-muted hover:text-fg'}`}
          >
            {REASON_LABEL[r]}
          </button>
        ))}
      </div>
    </div>
  );
}
