/* Sentence segmentation for select-in-passage.
 *
 * The player and the content checker must agree on what "a sentence" is, or an
 * answer that validates could be unclickable. Both use this function. */

const ABBREV = /(?:\b(?:Dr|Mr|Mrs|Ms|Prof|St|Mt|vs|etc|No|Fig|approx|cf|Inc|Ltd|Jr|Sr)|\b[A-Z]|\b(?:e\.g|i\.e|U\.S|U\.K|a\.m|p\.m))\.$/;

export function splitSentences(paragraph: string): string[] {
  const out: string[] = [];
  let buf = '';
  const parts = paragraph.split(/(?<=[.!?]["”’')\]]?)\s+/);
  for (const part of parts) {
    buf = buf ? `${buf} ${part}` : part;
    if (ABBREV.test(buf.trim())) continue; // glue "Dr." and "e.g." to what follows
    out.push(buf.trim());
    buf = '';
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}
