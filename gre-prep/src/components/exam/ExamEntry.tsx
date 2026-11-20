'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { ClientQuestion } from '@/content/types';
import { pickChapterTest } from '@/lib/chapter-test';
import { ExamSkeleton } from './ExamSkeleton';
import { SetRunner } from './SetRunner';

function clampDiff(raw: string | null, fallback: number): number {
  const n = Number(raw);
  if (!raw || Number.isNaN(n)) return fallback;
  return Math.min(5, Math.max(1, Math.round(n)));
}

function makeSeed(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/* Entry for a statically generated practice set. The page HTML is the same for
 * every mode, so it can be cached and saved offline; the mode (?mode=timed) and
 * chapter-test draw parameters (?min=..&max=..&seed=..) are read in the browser. */
export function ExamEntry({
  setId, title, questions, backHref, chapterTest,
}: {
  setId: string; title: string; questions: ClientQuestion[]; backHref: string; chapterTest: boolean;
}) {
  const sp = useSearchParams();
  const mode = sp.get('mode');
  const urlSeed = sp.get('seed');
  const urlMin = clampDiff(sp.get('min'), 1);
  const urlMax = Math.max(urlMin, clampDiff(sp.get('max'), 5));

  const [override, setOverride] = useState<{
    forUrlSeed: string | null;
    seed: string;
    dMin: number;
    dMax: number;
  } | null>(null);

  useEffect(() => {
    if (!chapterTest || urlSeed) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOverride((prev) =>
      prev && prev.forUrlSeed === null
        ? prev
        : { forUrlSeed: null, seed: makeSeed(), dMin: urlMin, dMax: urlMax },
    );
  }, [chapterTest, urlSeed, urlMin, urlMax]);

  const activeOverride = override && override.forUrlSeed === urlSeed ? override : null;
  const activeSeed = activeOverride?.seed ?? urlSeed;
  const range = useMemo(
    () => ({
      dMin: activeOverride?.dMin ?? urlMin,
      dMax: activeOverride?.dMax ?? urlMax,
    }),
    [activeOverride, urlMin, urlMax],
  );

  const activeQuestions = useMemo(() => {
    if (!chapterTest) return questions;
    if (!activeSeed) return [];
    return pickChapterTest(questions, {
      dMin: range.dMin,
      dMax: range.dMax,
      seed: `${setId}:${activeSeed}`,
    });
  }, [chapterTest, questions, activeSeed, range.dMin, range.dMax, setId]);

  if (chapterTest && (!activeSeed || activeQuestions.length === 0)) {
    return <ExamSkeleton title={title} />;
  }

  const timed = mode === 'timed' || chapterTest;
  // ~ the per-question target the real test allows, rounded up to a whole minute.
  const limit = Math.ceil(activeQuestions.reduce((a, q) => a + q.estSeconds, 0) / 60) * 60;
  const effectiveTitle = chapterTest
    ? `${title} (levels ${range.dMin}–${range.dMax})`
    : timed && setId === 'custom'
      ? 'Timed practice'
      : title;
  const storageKey = chapterTest
    ? `exam:${setId}:t:${range.dMin}-${range.dMax}:${activeSeed}`
    : `exam:${setId}:${timed ? 't' : 'u'}`;

  return (
    <SetRunner
      key={chapterTest ? `${activeSeed}:${range.dMin}-${range.dMax}` : setId}
      title={effectiveTitle}
      questions={activeQuestions}
      mode={timed ? 'timed' : 'tutor'}
      timeLimitSec={timed ? limit : undefined}
      backHref={backHref}
      storageKey={storageKey}
      skipAnswered={!timed && !chapterTest}
      difficultyRange={chapterTest ? range : undefined}
      setId={setId}
      runKind={chapterTest ? 'chapter' : 'lesson'}
      onNewTest={
        chapterTest
          ? (nextMin, nextMax) => {
              const lo = Math.min(5, Math.max(1, Math.round(nextMin)));
              const hi = Math.max(lo, Math.min(5, Math.round(nextMax)));
              setOverride({ forUrlSeed: urlSeed, seed: makeSeed(), dMin: lo, dMax: hi });
            }
          : undefined
      }
    />
  );
}
