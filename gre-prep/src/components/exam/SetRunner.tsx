'use client';

import { useState } from 'react';
import type { ClientQuestion } from '@/content/types';
import { ExamPlayer } from './ExamPlayer';

/* Runs a set and lets the learner go straight back at the questions they missed. */

export function SetRunner({
  title, questions, mode, timeLimitSec, backHref, storageKey, skipAnswered,
}: {
  title: string; questions: ClientQuestion[]; mode: 'tutor' | 'timed'; timeLimitSec?: number; backHref: string; storageKey: string; skipAnswered?: boolean;
}) {
  const [round, setRound] = useState(0);
  const [subset, setSubset] = useState<string[] | null>(null);
  const qs = subset ? questions.filter((q) => subset.includes(q.id)) : questions;
  return (
    <ExamPlayer
      key={round}
      title={subset ? `${title} — missed` : title}
      questions={qs}
      mode={mode}
      timeLimitSec={subset ? undefined : timeLimitSec}
      backHref={backHref}
      storageKey={`${storageKey}:${round}`}
      skipAnswered={skipAnswered && round === 0 && !subset}
      onRetryMissed={(ids) => { setSubset(ids); setRound((r) => r + 1); }}
    />
  );
}
