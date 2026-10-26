'use client';

import { CheckCircle2 } from 'lucide-react';
import { lessonStats, useAttempts } from '@/hooks/useAttempts';

export function Bar({ value, max, label }: { value: number; max: number; label?: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-good transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-10 text-right text-xs tabular-nums text-muted">{value}/{max}</span>
    </div>
  );
}

export function LessonProgress({ lessonId, total }: { lessonId: string; total: number }) {
  const s = lessonStats(useAttempts(), lessonId);
  if (total === 0) return null;
  const done = s.mastered === total;
  return (
    <div className="flex items-center gap-2">
      {done && <CheckCircle2 size={16} className="shrink-0 text-good" aria-label="Mastered" />}
      <div className="min-w-0 flex-1"><Bar value={s.mastered} max={total} label="Practice mastered" /></div>
    </div>
  );
}

export function ChapterProgress({ lessons }: { lessons: { id: string; total: number }[] }) {
  const attempts = useAttempts();
  const total = lessons.reduce((a, l) => a + l.total, 0);
  const mastered = lessons.reduce((a, l) => a + lessonStats(attempts, l.id).mastered, 0);
  if (total === 0) return null;
  return <Bar value={mastered} max={total} label="Chapter progress" />;
}
