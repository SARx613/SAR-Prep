'use server';

import { gradeExam, type ExamKey } from '@/lib/official-grading';
import type { ExamContent, ExamMeta, ExamResponses, ExamResult } from '@/types/official';
import { readPrivateJson } from '@/lib/private-content';

/**
 * Official full-length tests (private study material, see private-content.ts).
 *
 * The answer key never leaves the server: `getExam` returns the questions
 * alone, and `finishExam` is the only place the key is read. Grading happens
 * once, when the test ends, as on the real exam — there is no per-question
 * feedback to leak the key early. Results live in the browser (see
 * official-storage.ts); nothing is written to the database.
 */

const IDS = ['test-1', 'test-2'];

/** The tests installed in gre-prep/private/official-tests (none on a public build). */
function loadExams(): Record<string, { content: ExamContent; key: ExamKey }> {
  const out: Record<string, { content: ExamContent; key: ExamKey }> = {};
  for (const id of IDS) {
    const content = readPrivateJson<ExamContent>(`official-tests/${id}.json`);
    const key = readPrivateJson<ExamKey>(`official-tests/${id}.key.json`);
    if (content && key) out[id] = { content, key };
  }
  return out;
}

const MAX_ESSAY_CHARS = 20_000;

export async function listExams(): Promise<ExamMeta[]> {
  return Object.values(loadExams()).map(({ content }) => ({
    id: content.id,
    number: content.number,
    title: content.title,
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
  return loadExams()[id]?.content ?? null;
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
  const exam = loadExams()[id];
  if (!exam) throw new Error('Unknown test');
  const graded = gradeExam(exam.content, exam.key, sanitize(responses), timeMs);
  return { examId: id, completedAt: new Date().toISOString(), ...graded };
}
