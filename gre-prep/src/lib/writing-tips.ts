/* Automatic checks and level-by-level advice for the Issue essay.
 *
 * The checks are plain text heuristics: they spot what a rater would notice
 * at a glance (length, paragraphs, transitions, examples, engagement with the
 * other side), not the quality of the thinking. They are not a score. */

export interface Check { ok: boolean; label: string; detail: string }

const words = (t: string) => t.toLowerCase().match(/[a-z']+/g) ?? [];
const sentences = (t: string) => t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.split(/\s+/).length > 2);

const TRANSITIONS = ['however', 'therefore', 'moreover', 'furthermore', 'consequently', 'nevertheless', 'in contrast', 'on the other hand', 'as a result', 'for this reason', 'although', 'while', 'whereas', 'because', 'thus', 'instead', 'yet'];
const EXAMPLES = ['for example', 'for instance', 'such as', 'consider', 'imagine', 'suppose', 'in the case of', 'a case in point', 'to illustrate'];
const CONCESSION = ['although', 'admittedly', 'granted', 'to be sure', 'critics', 'opponents', 'on the other hand', 'it is true that', 'one might argue', 'some will say', 'skeptics', 'however', 'whereas'];
const ABSOLUTES = ['always', 'never', 'everyone', 'nobody', 'all people', 'every single', 'completely', 'totally', 'undoubtedly', 'obviously'];
const CLICHES = ['in today\'s society', 'in this day and age', 'since the dawn of time', 'nowadays', 'in modern society', 'throughout history'];
const COMMON = new Set(['should', 'would', 'could', 'people', 'about', 'there', 'their', 'which', 'these', 'those', 'because', 'something', 'without', 'between', 'through', 'other', 'being', 'where', 'while', 'every', 'though', 'still']);

const count = (text: string, list: string[]) => list.reduce((n, k) => n + (text.split(k).length - 1), 0);

export function diagnose(text: string): Check[] {
  const lower = text.toLowerCase();
  const w = words(text);
  const paras = text.split(/\n\s*\n|\n/).map((p) => p.trim()).filter(Boolean);
  const sents = sentences(text);
  const lens = sents.map((s) => s.split(/\s+/).length);
  const avg = lens.length ? lens.reduce((a, b) => a + b, 0) / lens.length : 0;
  const longest = lens.length ? Math.max(...lens) : 0;
  const sd = lens.length ? Math.sqrt(lens.reduce((a, b) => a + (b - avg) ** 2, 0) / lens.length) : 0;
  const freq = new Map<string, number>();
  for (const x of w) if (x.length > 5 && !COMMON.has(x)) freq.set(x, (freq.get(x) ?? 0) + 1);
  const repeated = [...freq.entries()].filter(([, n]) => n >= 5).sort((a, b) => b[1] - a[1]).slice(0, 3);
  const cliche = CLICHES.find((c) => lower.slice(0, 160).includes(c));

  return [
    { ok: w.length >= 300, label: 'Length', detail: w.length >= 300 ? `${w.length} words: enough room to develop reasons.` : `${w.length} words. Strong responses usually run 350–550: add one fully developed example rather than more claims.` },
    { ok: paras.length >= 4, label: 'Structure', detail: paras.length >= 4 ? `${paras.length} paragraphs.` : `${paras.length} paragraph(s). Aim for introduction, two or three body paragraphs (one idea each) and a short conclusion; the last body paragraph is the best place for the opposing view.` },
    { ok: count(lower, EXAMPLES) >= 2, label: 'Concrete examples', detail: count(lower, EXAMPLES) >= 2 ? 'You signal examples. Check each one actually proves the point it follows.' : 'Few or no signalled examples. Every body paragraph should contain one specific case (a scenario, an event, a field) and a sentence saying what it shows.' },
    { ok: count(lower, CONCESSION) >= 1, label: 'Other side', detail: count(lower, CONCESSION) >= 1 ? 'You acknowledge another view. Make sure you answer it, not just mention it.' : 'No sign that you weighed the opposing view. Most task instructions require it: concede what is fair, then explain why your position still holds.' },
    { ok: count(lower, TRANSITIONS) >= 4, label: 'Connections', detail: count(lower, TRANSITIONS) >= 4 ? 'Ideas are linked with connecting words.' : 'Few connecting words. Show how each sentence follows from the last (because, therefore, however) so a reader never has to guess the logic.' },
    { ok: lens.length === 0 || (sd >= 6 && longest <= 45), label: 'Sentence variety', detail: lens.length === 0 ? '' : longest > 45 ? `Your longest sentence has ${longest} words: split it.` : sd < 6 ? `Sentences are uniform (average ${avg.toFixed(0)} words). Mix short, direct sentences with longer ones that carry a qualification.` : `Good variety (average ${avg.toFixed(0)} words).` },
    { ok: count(lower, ABSOLUTES) < 3, label: 'Qualification', detail: count(lower, ABSOLUTES) < 3 ? 'Claims are measured.' : 'Several absolute words (always, never, everyone, obviously). Qualify them: say when and for whom the claim holds.' },
    { ok: repeated.length === 0, label: 'Repetition', detail: repeated.length === 0 ? 'No overused words.' : `Overused: ${repeated.map(([x, n]) => `“${x}” (${n}×)`).join(', ')}. Vary wording or use a pronoun.` },
    { ok: !cliche, label: 'Opening', detail: cliche ? `The opening uses a stock phrase (“${cliche}”). Start with your position or a concrete observation about the topic instead.` : 'The opening avoids stock phrases.' },
  ].filter((c) => c.detail);
}

export type CriterionKey = 'position' | 'development' | 'organization' | 'language' | 'conventions';

/** What to do to move up from a given level, by criterion. Level bands: 1–2, 3–4, 5–6. */
export const LEVEL_TIPS: Record<CriterionKey, Record<'low' | 'mid' | 'high', string[]>> = {
  position: {
    low: ['State your position in the first paragraph in one clear sentence that answers the exact question the task asks.', 'Re-read the instructions: they tell you what to do (weigh consequences, address the strongest objection, choose a view). Do it.'],
    mid: ['Make the position specific: when, for whom, to what degree. “Mostly agree, except where…” beats “I agree”.', 'Keep returning to the thesis; end each body paragraph by tying it back.'],
    high: ['Sharpen the thesis so that a reader could disagree with it, then show you know exactly where the disagreement would start.', 'Let the conclusion add a consequence or a condition rather than restating the opening.'],
  },
  development: {
    low: ['Give a reason for every claim: a sentence beginning “because”.', 'Add one specific example per body paragraph and say in one sentence what it proves.'],
    mid: ['Replace general examples (“many people”) with concrete scenarios (who, where, what happened).', 'Add the step between example and claim: explain why this case is typical, not just that it exists.'],
    high: ['Test your own examples: name a case where they would fail and say why your position survives.', 'Prefer fewer, deeper paragraphs over many thin ones.'],
  },
  organization: {
    low: ['Plan for three minutes first: thesis, two reasons, one objection. Then write intro, body, conclusion.', 'One idea per paragraph; open each with a sentence that states it.'],
    mid: ['Order the body paragraphs by strength or by logic, and say so with transitions (“A second, deeper reason…”).', 'Cut sentences that do not serve the thesis.'],
    high: ['Make each paragraph build on the previous one (concede, qualify, then resolve) instead of listing points.', 'Close the loop: the last paragraph should answer the question the first one raised.'],
  },
  language: {
    low: ['Use short, plain sentences you control; replace vague words (“thing”, “good”) with the precise noun or verb.', 'Read each sentence aloud in your head: if you stumble, split it.'],
    mid: ['Vary sentence openings and lengths; use subordinate clauses to carry qualifications.', 'Swap repeated words for exact synonyms, but never for an unfamiliar word you are unsure of.'],
    high: ['Cut filler (“it is important to note that”). Every word should carry meaning.', 'Choose verbs that state the relation (undermines, entails, outweighs) instead of “is” and “has”.'],
  },
  conventions: {
    low: ['Fix the errors that obscure meaning first: sentence boundaries (run-ons and fragments), subject-verb agreement, tense.', 'Leave two minutes to proofread. There is no spell-checker on the real test.'],
    mid: ['Check commas around clauses, apostrophes, and commonly confused words (their/there, its/it’s, affect/effect).', 'Keep verb tense and pronoun reference consistent within a paragraph.'],
    high: ['Minor slips cost little; scan once for typos in the first and last paragraphs where raters read most carefully.'],
  },
};

export const bandOf = (level: number): 'low' | 'mid' | 'high' => (level <= 2 ? 'low' : level <= 4 ? 'mid' : 'high');
