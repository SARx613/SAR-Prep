/* Regenerates src/lib/generators/verbal/deck-words.ts from the flashcard
 * deck, so the verbal generators can tag questions with the deck words they
 * use without reading the filesystem at build time.
 *
 *   npx tsx scripts/gen-deck-words.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';

const deck: { word: string }[] = JSON.parse(readFileSync('public/words.json', 'utf8'));
const words = deck.map((w) => w.word.toLowerCase()).sort();

writeFileSync(
  'src/lib/generators/verbal/deck-words.ts',
  `/* Deck vocabulary — generated from public/words.json.
 *
 * Kept as a module rather than read at runtime so that tagging a question
 * with the flashcard words it uses stays pure and testable. Regenerate with
 * scripts/gen-deck-words.ts whenever the deck changes.
 */

export const DECK_WORDS: ReadonlySet<string> = new Set([
${words.map((w) => '  ' + JSON.stringify(w) + ',').join('\n')}
]);

export const DECK_SIZE = ${words.length};
`
);

console.log(`wrote ${words.length} deck words`);
