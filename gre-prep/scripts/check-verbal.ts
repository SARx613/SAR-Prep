/* Verbal integrity checks.
 *
 * Structural validation (in generators/index.ts) proves an item is
 * well-formed. These checks prove something harder: that the item has
 * exactly one defensible answer, and that it draws on the flashcard deck.
 *
 *   1. SE items must not contain a second synonymous pair among the
 *      distractors, which would give the item two valid answers. Checked
 *      against the deck's own synonym lists.
 *   2. The credited SE pair should itself be attested as synonymous.
 *   3. No word may appear twice within one item's choices.
 *   4. Every {{n}} marker must have a matching blank, and vice versa.
 *   5. select_in_passage targets must occur verbatim in the passage.
 *   6. Vocabulary coverage against the flashcard deck is reported.
 *
 *   npx tsx --env-file=.env.local scripts/check-verbal.ts
 */

import { readFileSync } from 'node:fs';
import { generateBank } from '../src/lib/generators';
import { ALL_PASSAGES, ALL_SE, ALL_TC } from '../src/lib/generators/verbal/index';
import { findUnresolved } from '../src/lib/generators/verbal/explain';

interface Word {
  word: string;
  definition: string;
  synonyms?: string[];
}

const deck: Word[] = JSON.parse(readFileSync('public/words.json', 'utf8'));
const deckWords = new Set(deck.map((w) => w.word.toLowerCase()));

/** Undirected synonym graph built from the deck. */
const synonyms = new Map<string, Set<string>>();
const link = (a: string, b: string) => {
  if (!synonyms.has(a)) synonyms.set(a, new Set());
  synonyms.get(a)!.add(b);
};
for (const w of deck) {
  const a = w.word.toLowerCase();
  for (const s of w.synonyms ?? []) {
    const b = s.toLowerCase();
    link(a, b);
    link(b, a);
  }
}
const areSynonyms = (a: string, b: string): boolean =>
  synonyms.get(a.toLowerCase())?.has(b.toLowerCase()) ?? false;

let errors = 0;
let warnings = 0;
const err = (m: string) => {
  errors++;
  console.log(`  ERROR  ${m}`);
};
const warn = (m: string) => {
  warnings++;
  console.log(`  warn   ${m}`);
};

/* ── Sentence Equivalence ─────────────────────────────────────────────── */

console.log(`\nSentence Equivalence — ${ALL_SE.length} frames`);
let attestedPairs = 0;

for (const f of ALL_SE) {
  const label = `"${f.text.slice(0, 48)}…"`;
  const all = [...f.pair, ...f.distractors].map((w) => w.toLowerCase());

  if (new Set(all).size !== all.length) err(`${label}: duplicate choice`);
  if (!f.text.includes('{{1}}')) err(`${label}: missing {{1}} marker`);
  if (f.distractors.length !== 4) err(`${label}: ${f.distractors.length} distractors, expected 4`);

  // The item must have exactly one valid pair. Any two distractors that the
  // deck lists as synonyms would form a second one.
  for (let i = 0; i < f.distractors.length; i++) {
    for (let j = i + 1; j < f.distractors.length; j++) {
      if (areSynonyms(f.distractors[i], f.distractors[j])) {
        err(`${label}: distractors "${f.distractors[i]}" and "${f.distractors[j]}" are synonyms — second valid answer`);
      }
    }
  }
  // A distractor synonymous with a key would also muddy the answer.
  for (const d of f.distractors) {
    for (const k of f.pair) {
      if (areSynonyms(d, k)) {
        err(`${label}: distractor "${d}" is a synonym of key "${k}"`);
      }
    }
  }

  if (areSynonyms(f.pair[0], f.pair[1])) attestedPairs++;
}

console.log(
  `  ${attestedPairs}/${ALL_SE.length} credited pairs attested as synonyms in the deck`
);

/* ── Text Completion ──────────────────────────────────────────────────── */

console.log(`\nText Completion — ${ALL_TC.length} frames`);

for (const f of ALL_TC) {
  const label = `"${f.text.slice(0, 48)}…"`;
  const markers = [...f.text.matchAll(/\{\{(\d)\}\}/g)].map((m) => Number(m[1]));

  if (markers.length !== f.blanks.length) {
    err(`${label}: ${markers.length} markers but ${f.blanks.length} blanks`);
  }
  for (let i = 1; i <= f.blanks.length; i++) {
    if (!markers.includes(i)) err(`${label}: no {{${i}}} marker`);
  }

  const want = f.blanks.length === 1 ? 4 : 2;
  f.blanks.forEach((b, i) => {
    if (b.distractors.length < want) {
      err(`${label}: blank ${i + 1} has ${b.distractors.length} distractors, needs ${want}`);
    }
    const all = [b.correct, ...b.distractors].map((w) => w.toLowerCase());
    if (new Set(all).size !== all.length) err(`${label}: blank ${i + 1} duplicate choice`);

    // A distractor synonymous with the key would be defensible too.
    for (const d of b.distractors) {
      if (areSynonyms(d, b.correct)) {
        err(`${label}: blank ${i + 1} distractor "${d}" is a synonym of key "${b.correct}"`);
      }
    }
  });
}

/* ── Reading Comprehension ────────────────────────────────────────────── */

const rcQuestions = ALL_PASSAGES.flatMap((p) => p.questions);
console.log(`\nReading Comprehension — ${ALL_PASSAGES.length} passages, ${rcQuestions.length} questions`);

for (const p of ALL_PASSAGES) {
  for (const q of p.questions) {
    const label = `"${p.title}" / "${q.stem.slice(0, 40)}…"`;

    if (q.format === 'select_in_passage') {
      if (!q.sentence) err(`${label}: no target sentence`);
      else if (!p.body.includes(q.sentence)) err(`${label}: target sentence not in passage`);
      continue;
    }

    if (!q.choices?.length) {
      err(`${label}: no choices`);
      continue;
    }
    if (new Set(q.choices).size !== q.choices.length) err(`${label}: duplicate choice text`);
    if (q.format === 'select_one' && q.choices.length < 5) {
      warn(`${label}: only ${q.choices.length} choices`);
    }
    if (q.format === 'select_all') {
      if (!q.correctTexts?.length) err(`${label}: select_all without correctTexts`);
      for (const t of q.correctTexts ?? []) {
        if (!q.choices.includes(t)) err(`${label}: correctText not among choices`);
      }
      if ((q.correctTexts?.length ?? 0) === q.choices.length) {
        warn(`${label}: every choice is credited`);
      }
    }
  }
}

const byCategory: Record<string, number> = {};
for (const q of rcQuestions) byCategory[q.category] = (byCategory[q.category] ?? 0) + 1;
console.log('  by category:', byCategory);

/* ── Vocabulary coverage ──────────────────────────────────────────────── */

// Keys and distractors are reported separately: the credited words are what
// the item actually teaches, so deck coverage matters most there.
const keys = new Set<string>();
const distractors = new Set<string>();
for (const f of ALL_SE) {
  for (const w of f.pair) keys.add(w.toLowerCase());
  for (const w of f.distractors) distractors.add(w.toLowerCase());
}
for (const f of ALL_TC) {
  for (const b of f.blanks) {
    keys.add(b.correct.toLowerCase());
    for (const w of b.distractors) distractors.add(w.toLowerCase());
  }
}
const all = new Set([...keys, ...distractors]);
const pct = (n: number, d: number) => `${Math.round((n / d) * 100)}%`;
const inDeck = (s: Set<string>) => [...s].filter((w) => deckWords.has(w)).length;

console.log(`\nVocabulary (deck: ${deck.length} words)`);
console.log(`  credited answers : ${inDeck(keys)}/${keys.size} in deck (${pct(inDeck(keys), keys.size)})`);
console.log(`  distractors      : ${inDeck(distractors)}/${distractors.size} in deck (${pct(inDeck(distractors), distractors.size)})`);
console.log(`  all choices      : ${inDeck(all)}/${all.size} in deck (${pct(inDeck(all), all.size)})`);

/* ── Built-item checks ────────────────────────────────────────────────── */

// Explanations are authored against the order the choices were written in,
// but the choices are shuffled when the item is built. Every positional
// reference must therefore have been rewritten into the letter the choice
// actually landed on, and every letter named must exist on the item.
console.log('\nBuilt items');
const bank = generateBank({ perTemplateDifficulty: 2 });
const built = [...bank.questions, ...bank.passages.flatMap((p) => p.questions)];

let unresolved = 0;
let badLetters = 0;
for (const q of built) {
  const hits = findUnresolved(q.explanation);
  if (hits.length) {
    unresolved++;
    err(`unresolved ordinal in ${q.type}/${q.subtopic}: ${hits.join(', ')}`);
  }
  const content = q.content as { choices?: { id: string }[] };
  if (!content.choices) continue;
  const ids = new Set(content.choices.map((c) => c.id));
  for (const m of q.explanation.matchAll(/\bChoices? ([A-F])(?: and ([A-F]))?/g)) {
    for (const id of [m[1], m[2]].filter(Boolean)) {
      if (!ids.has(id as string)) {
        badLetters++;
        err(`explanation names choice ${id}, which the item does not have`);
      }
    }
  }
}
console.log(`  ${built.length} built items checked`);
console.log(`  ${unresolved} with unresolved positional references`);
console.log(`  ${badLetters} references to non-existent choices`);

/* ── Result ───────────────────────────────────────────────────────────── */

console.log(`\n${errors} errors, ${warnings} warnings`);
process.exit(errors === 0 ? 0 : 1);
