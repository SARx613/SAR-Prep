/* Originality check: no run of N consecutive words from the official ETS
 * texts may appear in our content (PLAN §3.1: never copy).
 *
 *   npm run content:originality -- --refs <dir-with-ets-texts> [--n 8]
 *
 * <dir> holds plain-text extracts (pdftotext) of the ETS documents; they are
 * copyrighted and are not committed. Exits 1 on any match.
 */
import fs from 'node:fs';
import path from 'node:path';
import { loadContent } from '../src/content/load';

const arg = (n: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : undefined; };
const refs = arg('refs'); const N = Number(arg('n') ?? 8);
if (!refs) { console.error('--refs <dir> required'); process.exit(1); }

const words = (s: string) =>
  s.toLowerCase().replace(/\$[^$]*\$/g, ' ').replace(/<[^>]+>/g, ' ').replace(/[^a-z0-9'’\s-]/g, ' ').split(/\s+/).filter(Boolean);

/* Wording the real test fixes and we must reproduce for fidelity (the four Quantitative
 * Comparison choices and stem), plus technical phrases with no alternative wording. */
const ALLOW = [
  'the relationship cannot be determined from the information given',
  'compare quantity a and quantity b using additional information centered above the two quantities if such information is given',
  'probability distribution of the random variable',
  'probability distribution of the random variable x x',
  'total 100 0 100 0 total number of',
].map((a) => words(a).join(' '));

const shingles = new Map<string, string>();
for (const f of fs.readdirSync(refs).filter((x) => x.endsWith('.txt'))) {
  const w = words(fs.readFileSync(path.join(refs, f), 'utf8'));
  for (let i = 0; i + N <= w.length; i++) shingles.set(w.slice(i, i + N).join(' '), f);
}

const c = loadContent();
let hits = 0;
const scan = (where: string, text: string) => {
  const w = words(text);
  for (let i = 0; i + N <= w.length; i++) {
    const run = w.slice(i, i + N).join(' ');
    const src = shingles.get(run);
    // Formula-like runs (several one-letter symbols) are notation, not prose.
    const formula = w.slice(i, i + N).filter((t) => t.length === 1).length >= 3;
    if (src && !formula && !ALLOW.some((a) => a.includes(run))) { hits++; console.error(`COPIED ${where}: "${w.slice(i, i + N).join(' ')}" (from ${src})`); i += N; }
  }
};
const strings = (o: unknown): string[] =>
  typeof o === 'string' ? [o] : Array.isArray(o) ? o.flatMap(strings) : o && typeof o === 'object' ? Object.values(o).flatMap(strings) : [];

for (const [id, l] of c.lessons) scan(`lessons/${id}`, strings([l.why, l.rule, l.examples, l.trap, l.checks]).join(' \n '));
for (const [id, qs] of c.questionSets) for (const q of qs) scan(`${id}/${q.id}`, strings(q).join(' \n '));
for (const [id, p] of c.passages) scan(`passages/${id}`, p.paragraphs.join(' '));
scan('writing-prompts.json', strings(JSON.parse(fs.readFileSync(path.join(process.cwd(), 'content', 'writing-prompts.json'), 'utf8'))).join(' \n '));
console.log(hits ? `${hits} copied run(s) of ≥ ${N} words` : `no run of ${N}+ words copied from ${refs}`);
process.exit(hits ? 1 : 0);
