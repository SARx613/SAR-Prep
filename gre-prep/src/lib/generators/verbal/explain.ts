/* Resolves positional references in authored explanations.
 *
 * Explanations are written against the authored order of the choices ("the
 * second choice overstates…"), but the choices are shuffled when the item
 * is built, so by the time a reader sees them the ordinals are wrong. This
 * rewrites each ordinal into the letter the choice actually landed on.
 *
 * The rewrite is deliberately conservative: an ordinal is only treated as a
 * choice reference when it is not followed by a noun naming something else
 * in the passage (paragraph, sentence, prediction, …). Anything left
 * unresolved is reported by `findUnresolved`, which the check script runs,
 * so a missed reference fails loudly rather than shipping wrong.
 */

const ORDINALS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'] as const;

/** Nouns that mark an ordinal as referring to something other than a choice. */
const NOT_A_CHOICE =
  /^(paragraph|sentence|clause|blank|quantity|prediction|effect|study|trial|century|edition|column|row|line|section|reading|point|stage|step|volume|chapter|half|term|element|passage|equation|side|draw|test|meeting|year|leg|angle|figure|bar|term|by)\b/i;

/**
 * @param explanation authored text, referring to choices by position
 * @param order       authored index → final choice id (order[0] is the id
 *                    the first-authored choice ended up with)
 */
export function resolveOrdinals(explanation: string, order: string[]): string {
  // Two ordinals joined by "and": "The third and fourth are stronger…"
  const pair = new RegExp(
    `\\b(The|the)\\s+(${ORDINALS.join('|')})\\s+and\\s+(${ORDINALS.join('|')})\\b(\\s+choices)?`,
    'g'
  );

  let out = explanation.replace(pair, (match, article, a, b, choicesWord, offset: number) => {
    const rest = explanation.slice(offset + match.length).trimStart();
    if (!choicesWord && NOT_A_CHOICE.test(rest)) return match;
    const ia = ORDINALS.indexOf(a);
    const ib = ORDINALS.indexOf(b);
    if (ia < 0 || ib < 0 || ia >= order.length || ib >= order.length) return match;
    const lead = article === 'The' ? 'Choices' : 'choices';
    return `${lead} ${order[ia]} and ${order[ib]}`;
  });

  // Single ordinal: "the second choice", or "The third is contradicted".
  const single = new RegExp(`\\b(The|the)\\s+(${ORDINALS.join('|')})\\b(\\s+choice)?`, 'g');

  out = out.replace(single, (match, article, ord, choiceWord, offset: number) => {
    const rest = out.slice(offset + match.length).trimStart();
    if (!choiceWord && NOT_A_CHOICE.test(rest)) return match;
    const i = ORDINALS.indexOf(ord);
    if (i < 0 || i >= order.length) return match;
    const lead = article === 'The' ? 'Choice' : 'choice';
    return `${lead} ${order[i]}`;
  });

  return out;
}

/** Ordinal references that still look like unresolved choice references. */
export function findUnresolved(text: string): string[] {
  const re = new RegExp(`\\b(?:The|the)\\s+(?:${ORDINALS.join('|')})\\b(?:\\s+choices?)?`, 'g');
  const hits: string[] = [];
  for (const m of text.matchAll(re)) {
    const rest = text.slice(m.index! + m[0].length).trimStart();
    if (m[0].trimEnd().endsWith('choice') || m[0].trimEnd().endsWith('choices')) {
      hits.push(m[0]);
    } else if (!NOT_A_CHOICE.test(rest)) {
      hits.push(m[0]);
    }
  }
  return hits;
}
