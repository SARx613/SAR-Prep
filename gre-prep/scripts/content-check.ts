/* npm run content:check — validate everything under content/. Exit 1 on errors. */
import { loadContent } from '../src/content/load';
import { checkContent } from '../src/content/check';

const strict = process.argv.includes('--strict'); // also fail on unwritten lessons
// --only q2   → report only files whose path contains "q2" (authors check their own slice
// while other authors are mid-edit). Not for CI.
const onlyIdx = process.argv.indexOf('--only');
const only = onlyIdx >= 0 ? process.argv[onlyIdx + 1] : null;
const full = checkContent(loadContent());
const keep = (f: { file: string }) => !only || f.file.includes(only);
const result = { ...full, errors: full.errors.filter(keep), warnings: full.warnings.filter(keep) };

for (const w of result.warnings) console.warn(`warn  ${w.file}: ${w.message}`);
for (const e of result.errors) console.error(`ERROR ${e.file}: ${e.message}`);
console.log(JSON.stringify(result.stats));

const unwritten = result.stats.lessonsInSyllabus - result.stats.lessonsWritten;
if (result.errors.length || (strict && unwritten > 0)) {
  console.error(`content:check failed — ${result.errors.length} error(s)${strict ? `, ${unwritten} unwritten lesson(s)` : ''}`);
  process.exit(1);
}
console.log('content:check ok');
