/* Apply review verdicts (PLAN §9): mark questions source-checked and approved,
 * promote what has cleared the whole pipeline.
 *
 *   npm run content:approve -- --reviews <dir> --by <reviewer-name>
 *
 * For each <dir>/<lesson>.json with verdict "approve": every question of that
 * lesson (practice set and checks) gets sourceChecked = true; those with ≥ 2
 * solvers become status "published" with approvedBy; the lesson itself becomes
 * "published" when ALL of its questions did. Questions that lack solvers stay
 * "draft" and keep the lesson a draft.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadContent, CONTENT_DIR } from '../src/content/load';

const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const dir = arg('reviews'); const by = arg('by');
if (!dir || !by) { console.error('--reviews <dir> --by <name> required'); process.exit(1); }

const c = loadContent();
let published = 0, heldBack = 0;
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json'))) {
  const v = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as { lesson: string; verdict: string };
  if (v.verdict !== 'approve') { console.log(`skip ${v.lesson}: ${v.verdict}`); continue; }
  const lesson = c.lessons.get(v.lesson);
  const practice = c.questionSets.get(v.lesson) ?? [];
  if (!lesson) { console.warn(`no lesson ${v.lesson}`); continue; }
  const all = [...lesson.checks, ...practice];
  for (const q of all) {
    q.review.sourceChecked = true;
    if (q.review.solvedBy.length >= 2) { q.review.status = 'published'; q.review.approvedBy = by; published++; }
    else { q.review.status = 'draft'; heldBack++; }
  }
  lesson.status = all.every((q) => q.review.status === 'published') && practice.length >= 10 ? 'published' : 'draft';
  fs.writeFileSync(path.join(CONTENT_DIR, 'lessons', `${v.lesson}.json`), JSON.stringify(lesson, null, 1) + '\n');
  if (practice.length) fs.writeFileSync(path.join(CONTENT_DIR, 'questions', `${v.lesson}.json`), JSON.stringify(practice, null, 1) + '\n');
  console.log(`${v.lesson}: lesson ${lesson.status}`);
}
console.log(`${published} questions published, ${heldBack} held back (fewer than 2 solvers)`);
