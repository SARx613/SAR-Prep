/* Blind export for independent solvers (PLAN §9).
 *
 *   npm run content:blind -- --out <dir> [--only q1-,q2-] [--unsolved]
 *
 * Writes <dir>/<set>.json: every question with the answer key, explanations
 * and review fields removed, with its passage inlined. A solver reads these,
 * writes <answers>/<set>.json as { "<questionId>": <answer> } where <answer>
 * has the same shape as the question's `answer` field, e.g.
 *   TC {"blanks":["1A","2C"]}  SE {"choices":["B","E"]}  QC {"choice":"C"}
 *   PS/RC/DI choices {"choices":["A"]}  select-in-passage {"sentence":"…"}
 *   NE / DI numeric {"value":12.5}
 */
import fs from 'node:fs';
import path from 'node:path';
import type { ContentQuestionInput } from '../src/content/schema';
import { loadContent } from '../src/content/load';

const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const out = arg('out');
if (!out) { console.error('--out <dir> required'); process.exit(1); }
const only = arg('only')?.split(',');
const unsolved = process.argv.includes('--unsolved');
fs.mkdirSync(out, { recursive: true });

const c = loadContent();
let sets = 0, qn = 0;
// Lesson checks are verified like practice questions, as pseudo-sets "<lesson>@checks".
const all = new Map<string, (ContentQuestionInput[])>();
for (const [id, l] of c.lessons) all.set(`${id}@checks`, l.checks);
for (const [id, qs] of c.questionSets) all.set(id, qs);
for (const [setId, qs] of all) {
  if (only && !only.some((p) => setId.startsWith(p))) continue;
  const blind = qs
    .filter((q) => !unsolved || q.review.solvedBy.length < 2)
    .map((q) => {
      const { answer: _a, explanation: _e, choiceExplanations: _c, review: _r, ...rest } = q as Record<string, unknown> & { passageId?: string };
      void _a; void _e; void _c; void _r;
      const passage = rest.passageId ? c.passages.get(rest.passageId as string) : undefined;
      return { ...rest, passage: passage ? { paragraphs: passage.paragraphs } : undefined };
    });
  if (blind.length === 0) continue;
  fs.writeFileSync(path.join(out, `${setId}.json`), JSON.stringify(blind, null, 1));
  sets++; qn += blind.length;
}
console.log(`exported ${qn} questions in ${sets} sets to ${out}`);
