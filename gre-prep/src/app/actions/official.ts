'use server';

import { gradeExam, type ExamKey } from '@/lib/official-grading';
import type { BookLevel, ExamContent, ExamMeta, ExamResponses, ExamResult } from '@/types/official';
import { listPrivateDir, readPrivateJson } from '@/lib/private-content';
import { hasPrivateAccess } from '@/lib/private-access';

/**
 * Official full-length tests (private study material, see private-content.ts).
 *
 * The answer key never leaves the server: `getExam` returns the questions
 * alone, and `finishExam` is the only place the key is read. Grading happens
 * once, when the test ends, as on the real exam — there is no per-question
 * feedback to leak the key early. Results live in the browser (see
 * official-storage.ts); nothing is written to the database.
 */

interface SetIndexEntry {
  id: string;
  title: string;
  group: string;
  level?: BookLevel;
}

interface Loaded {
  content: ExamContent;
  key: ExamKey;
  meta: { group?: string; level?: BookLevel };
}

/** Full-length tests (official-tests/test-N.json) then practice sets
 * (official-sets/index.json, in book order), for allowed users only. */
async function loadExams(): Promise<Record<string, Loaded>> {
  const out: Record<string, Loaded> = {};
  if (!(await hasPrivateAccess())) return out;
  const tests = listPrivateDir('official-tests')
    .map((f) => f.match(/^(test-\d+)\.json$/)?.[1])
    .filter((x): x is string => !!x)
    .sort((a, b) => Number(a.slice(5)) - Number(b.slice(5)));
  for (const id of tests) {
    const content = readPrivateJson<ExamContent>(`official-tests/${id}.json`);
    const key = readPrivateJson<ExamKey>(`official-tests/${id}.key.json`);
    if (content && key) out[id] = { content: { ...content, kind: 'test' }, key, meta: {} };
  }
  for (const s of readPrivateJson<SetIndexEntry[]>('official-sets/index.json') ?? []) {
    if (!/^[a-z0-9-]+$/.test(s.id)) continue;
    const content = readPrivateJson<ExamContent>(`official-sets/${s.id}.json`);
    const key = readPrivateJson<ExamKey>(`official-sets/${s.id}.key.json`);
    if (content && key) out[s.id] = { content: { ...content, kind: 'set' }, key, meta: { group: s.group, level: s.level } };
  }
  return out;
}

const MAX_ESSAY_CHARS = 20_000;

export async function listExams(): Promise<ExamMeta[]> {
  return Object.values(await loadExams()).map(({ content, meta }) => ({
    id: content.id,
    number: content.number,
    title: content.title,
    kind: content.kind ?? 'test',
    source: content.source,
    ...meta,
    sections: content.sections.map((s) => ({
      id: s.id,
      kind: s.kind,
      title: s.title,
      minutes: s.minutes,
      questions: 'items' in s ? s.items.length : 1,
    })),
  }));
}

export async function getExam(id: string): Promise<ExamContent | null> {
  return (await loadExams())[id]?.content ?? null;
}

/** Keeps a hostile or corrupted payload from reaching the grader. */
function sanitize(responses: ExamResponses): ExamResponses {
  const out: ExamResponses = {};
  for (const [sid, r] of Object.entries(responses ?? {})) {
    if (!/^s\d$/.test(sid) || typeof r !== 'object' || !r) continue;
    out[sid] = {
      answers: Object.fromEntries(
        Object.entries(r.answers ?? {})
          .filter(([n]) => /^\d{1,2}$/.test(n))
          .map(([n, a]) => [
            n,
            {
              ids: Array.isArray(a.ids) ? a.ids.slice(0, 9).map(String) : undefined,
              blanks: Array.isArray(a.blanks) ? a.blanks.slice(0, 3).map((b) => (b ? String(b) : null)) : undefined,
              sentence: typeof a.sentence === 'number' ? a.sentence : undefined,
              text: typeof a.text === 'string' ? a.text.slice(0, 40) : undefined,
              num: typeof a.num === 'string' ? a.num.slice(0, 20) : undefined,
              den: typeof a.den === 'string' ? a.den.slice(0, 20) : undefined,
            },
          ]),
      ),
      essay: typeof r.essay === 'string' ? r.essay.slice(0, MAX_ESSAY_CHARS) : undefined,
    };
  }
  return out;
}

export async function finishExam(
  id: string,
  responses: ExamResponses,
  timeMs: Record<string, Record<number, number>>,
): Promise<ExamResult> {
  const exam = (await loadExams())[id];
  if (!exam) throw new Error('Unknown test');
  const graded = gradeExam(exam.content, exam.key, sanitize(responses), timeMs);
  return { examId: id, completedAt: new Date().toISOString(), ...graded };
}

/** Scores a finished test again (after an erratum), keeping the date it was taken. */
export async function rescoreExam(
  id: string,
  responses: ExamResponses,
  timeMs: Record<string, Record<number, number>>,
  completedAt: string,
): Promise<ExamResult> {
  const exam = (await loadExams())[id];
  if (!exam) throw new Error('Unknown test');
  const graded = gradeExam(exam.content, exam.key, sanitize(responses), timeMs);
  const when = Number.isNaN(Date.parse(completedAt)) ? new Date().toISOString() : completedAt;
  return { examId: id, completedAt: when, ...graded };
}
