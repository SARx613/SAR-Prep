/* Compare a solver's answers with the keys and record agreement.
 *
 *   npm run content:solved -- --solver solver-a --dir <answersDir> [--report <file>]
 *
 * For every question the solver answered: if the solver's answer grades as
 * correct against the key, the solver's name is added to review.solvedBy.
 * Disagreements are never written to the content; they go in the report for a
 * human/author to resolve (the key may be wrong, or the question ambiguous).
 */
import fs from 'node:fs';
import path from 'node:path';
import type { ContentQuestionInput } from '../src/content/schema';
import { loadContent, CONTENT_DIR } from '../src/content/load';
import { grade, type Response } from '../src/lib/grading';
import { sectionOf } from '../src/types/questions';

const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const solver = arg('solver'); const dir = arg('dir'); const report = arg('report');
if (!solver || !dir) { console.error('--solver and --dir required'); process.exit(1); }

const c = loadContent();
type Ans = Record<string, unknown>;
const toResponse = (type: string, a: Ans): Response => {
  if (Array.isArray(a.blanks)) return { kind: 'blanks', ids: a.blanks as string[] };
  if (Array.isArray(a.choices)) return { kind: 'choices', ids: a.choices as string[] };
  if (typeof a.choice === 'string') return { kind: 'choices', ids: [a.choice] };
  if (typeof a.sentence === 'string') return { kind: 'sentence', sentence: a.sentence };
  if (typeof a.value === 'number') return { kind: 'numeric', value: a.value };
  throw new Error(`unreadable answer for ${type}`);
};

// Practice sets live in questions/<set>.json; lesson checks inside lessons/<lesson>.json.
const targets: { setId: string; qs: ContentQuestionInput[]; write: () => void }[] = [];
for (const [setId, qs] of c.questionSets) targets.push({ setId, qs, write: () => fs.writeFileSync(path.join(CONTENT_DIR, 'questions', `${setId}.json`), JSON.stringify(qs, null, 1) + '\n') });
for (const [id, l] of c.lessons) targets.push({ setId: `${id}@checks`, qs: l.checks, write: () => fs.writeFileSync(path.join(CONTENT_DIR, 'lessons', `${id}.json`), JSON.stringify(l, null, 1) + '\n') });

let agreed = 0; const disagreed: { id: string; solver: unknown; key: unknown }[] = []; const missing: string[] = [];
for (const { setId, qs, write } of targets) {
  const file = path.join(dir, `${setId}.json`);
  if (!fs.existsSync(file)) continue;
  const answers = JSON.parse(fs.readFileSync(file, 'utf8')) as Record<string, Ans>;
  let changed = false;
  for (const q of qs) {
    const a = answers[q.id];
    if (!a) { missing.push(q.id); continue; }
    let ok = false;
    try {
      ok = grade({ type: q.type, section: sectionOf(q.type), content: q.content, answer: q.answer } as never, toResponse(q.type, a)).isCorrect;
    } catch { ok = false; }
    if (ok) {
      agreed++;
      if (!q.review.solvedBy.includes(solver)) { q.review.solvedBy.push(solver); changed = true; }
    } else disagreed.push({ id: q.id, solver: a, key: q.answer });
  }
  if (changed && !process.argv.includes('--dry')) write();
}
if (report) fs.writeFileSync(report, JSON.stringify({ solver, agreed, disagreed, missing }, null, 1));
console.log(`${solver}: ${agreed} agree, ${disagreed.length} disagree, ${missing.length} unanswered`);
for (const d of disagreed.slice(0, 40)) console.log(`  DISAGREE ${d.id}  solver=${JSON.stringify(d.solver)}  key=${JSON.stringify(d.key)}`);
