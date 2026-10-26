/* Semantic checks that a schema cannot express: the GRE's own format rules
 * (choice counts, key membership), the source rule, the word budget, and the
 * publishing pipeline. Pure — takes loaded content, returns findings.
 */

import { RULE_WORD_BUDGET, wordCount, type ContentQuestionInput } from './schema';
import type { LoadIssue, RawContent } from './load';
import { splitSentences } from '@/lib/sentences';

export interface CheckResult {
  errors: LoadIssue[];
  warnings: LoadIssue[];
  stats: {
    chapters: number;
    lessonsInSyllabus: number;
    lessonsWritten: number;
    lessonsPublished: number;
    questions: number;
    questionsPublished: number;
    passages: number;
  };
}

const mathBalanced = (s: string) => (s.match(/(?<!\\)\$/g)?.length ?? 0) % 2 === 0;

/** Dollar amounts must be written \$5; an unescaped one swallows the text up to the next $ as maths. */
export function looksLikeCurrencyInMath(s: string): boolean {
  for (const m of s.matchAll(/(?<!\\)\$([^$]*)(?<!\\)\$/g)) {
    const inner = m[1];
    if (/^\s|\s$/.test(inner)) return true;
    const stripped = inner.replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, ' ');
    if (/[A-Za-z]{3,}\s+[A-Za-z]{3,}\s+[A-Za-z]{3,}/.test(stripped)) return true;
  }
  return false;
}

export function checkQuestion(q: ContentQuestionInput, passages: RawContent['passages']): string[] {
  const e: string[] = [];
  const ids = (cs: { id: string }[]) => cs.map((c) => c.id);
  const unique = (xs: string[]) => new Set(xs).size === xs.length;
  const texts = (cs: { text: string }[]) => cs.map((c) => c.text.trim().toLowerCase());

  const richFields: string[] = [q.stem, q.explanation];
  const choiceLists: { id: string; text: string }[][] = [];

  switch (q.type) {
    case 'TC': {
      const n = q.content.blanks.length;
      const key = q.answer.blanks;
      if (key.length !== n) e.push('answer.blanks length differs from blank count');
      q.content.blanks.forEach((b, i) => {
        const want = n === 1 ? 5 : 3;
        if (b.choices.length !== want) e.push(`blank ${i + 1} has ${b.choices.length} choices, GRE has ${want}`);
        if (!unique(ids(b.choices))) e.push(`blank ${i + 1} choice ids not unique`);
        if (!unique(texts(b.choices))) e.push(`blank ${i + 1} has duplicate choice text`);
        if (!ids(b.choices).includes(key[i])) e.push(`blank ${i + 1} key not among choices`);
        if (b.index !== i + 1) e.push(`blank index ${b.index} out of order`);
        if (!q.content.text.includes(`{{${i + 1}}}`)) e.push(`text lacks marker {{${i + 1}}}`);
        choiceLists.push(b.choices);
      });
      richFields.push(q.content.text);
      break;
    }
    case 'SE': {
      const cs = q.content.choices;
      if (cs.length !== 6) e.push(`SE needs 6 choices, has ${cs.length}`);
      if (!unique(ids(cs)) || !unique(texts(cs))) e.push('SE choices not unique');
      const [a, b] = q.answer.choices;
      if (a === b) e.push('SE keys identical');
      if (!ids(cs).includes(a) || !ids(cs).includes(b)) e.push('SE key not among choices');
      if (!q.content.text.includes('{{1}}')) e.push('SE text lacks {{1}}');
      if ((q.content.text.match(/\{\{\d\}\}/g) ?? []).length !== 1) e.push('SE needs exactly one blank');
      choiceLists.push(cs);
      richFields.push(q.content.text);
      break;
    }
    case 'RC': {
      const p = passages.get(q.passageId);
      if (!p) e.push(`passage "${q.passageId}" not found`);
      const c = q.content;
      if (c.format === 'select_in_passage') {
        if (!('sentence' in q.answer)) e.push('select_in_passage needs answer.sentence');
        else if (p) {
          const paras = c.paragraphIndex !== undefined ? [p.paragraphs[c.paragraphIndex] ?? ''] : p.paragraphs;
          const target = (q.answer as { sentence: string }).sentence;
          if (!paras.some((para) => splitSentences(para).includes(target)))
            e.push('answer must equal exactly one sentence of the (selected) paragraph as the player splits it (see lib/sentences.ts)');
        }
      } else {
        const cs = c.choices ?? [];
        if (!('choices' in q.answer)) e.push('RC needs answer.choices');
        else {
          const key = q.answer.choices;
          if (c.format === 'select_one' && cs.length !== 5) e.push(`RC select-one has ${cs.length} choices, GRE has 5`);
          if (c.format === 'select_one' && key.length !== 1) e.push('RC select-one needs exactly 1 key');
          if (c.format === 'select_all' && cs.length !== 3) e.push(`RC select-all has ${cs.length} choices, GRE has 3`);
          if (c.format === 'select_all' && (key.length < 1 || key.length > 3)) e.push('RC select-all has 1–3 keys');
          if (!unique(ids(cs)) || !unique(texts(cs))) e.push('RC choices not unique');
          if (!key.every((k) => ids(cs).includes(k))) e.push('RC key not among choices');
        }
        choiceLists.push(cs);
      }
      break;
    }
    case 'QC':
      richFields.push(q.content.quantityA, q.content.quantityB, q.content.common ?? '');
      break;
    case 'PS': {
      const cs = q.content.choices;
      if (q.content.format === 'select_one' && cs.length !== 5) e.push(`PS select-one has ${cs.length} choices, GRE has 5`);
      if (q.content.format === 'select_one' && q.answer.choices.length !== 1) e.push('PS select-one needs exactly 1 key');
      if (q.content.format === 'select_all' && cs.length < 3) e.push('PS select-all needs ≥ 3 choices');
      if (!unique(ids(cs)) || !unique(texts(cs))) e.push('PS choices not unique');
      if (!q.answer.choices.every((k) => ids(cs).includes(k))) e.push('PS key not among choices');
      choiceLists.push(cs);
      break;
    }
    case 'NE': {
      if (!Number.isFinite(q.answer.value)) e.push('NE value not finite');
      if (q.content.format === 'integer' && !Number.isInteger(q.answer.value)) e.push('integer NE has non-integer value');
      if (q.content.format === 'fraction') {
        const f = q.answer.fraction;
        if (!f) e.push('fraction NE needs answer.fraction');
        else if (f.denominator === 0 || Math.abs(f.numerator / f.denominator - q.answer.value) > 1e-9)
          e.push('answer.fraction does not match answer.value');
      }
      break;
    }
    case 'DI': {
      const c = q.content;
      if (c.format === 'numeric_entry') {
        if (!c.numeric) e.push('DI numeric_entry needs content.numeric');
        if (!('value' in q.answer)) e.push('DI numeric_entry needs answer.value');
      } else {
        const cs = c.choices ?? [];
        if (!('choices' in q.answer)) e.push('DI choice item needs answer.choices');
        else {
          if (c.format === 'select_one' && cs.length !== 5) e.push(`DI select-one has ${cs.length} choices, GRE has 5`);
          if (!q.answer.choices.every((k) => ids(cs).includes(k))) e.push('DI key not among choices');
        }
        if (!unique(ids(cs))) e.push('DI choice ids not unique');
        choiceLists.push(cs);
      }
      break;
    }
  }

  for (const cs of choiceLists) for (const c of cs) richFields.push(c.text);
  if (richFields.some((s) => !mathBalanced(s))) e.push('unbalanced $ in rich text');
  if (richFields.some(looksLikeCurrencyInMath)) e.push('unescaped currency $ (write \\$5 in the text → "\\\\$5" in JSON) or math with prose inside');

  if (q.figure?.kind === 'svg') {
    const svg = (q.figure as { data: { svg: string } }).data.svg;
    if (/<script|<foreignObject|<image|<a[\s>]|\son\w+\s*=|javascript:|href\s*=/i.test(svg)) e.push('figure svg uses a forbidden element or attribute');
    if (!/viewBox=/.test(svg)) e.push('figure svg needs a viewBox');
  }

  // choiceExplanations must refer to real choice ids.
  if (q.choiceExplanations) {
    const all = new Set(choiceLists.flat().map((c) => c.id));
    for (const k of Object.keys(q.choiceExplanations)) if (!all.has(k)) e.push(`choiceExplanations key "${k}" is not a choice id`);
  }

  // Publishing pipeline (PLAN §9).
  if (q.review.status !== 'draft') {
    if (q.review.solvedBy.length < 2) e.push('verified/published needs ≥ 2 independent solvers');
    if (!q.review.sourceChecked) e.push('verified/published needs sourceChecked');
  }
  if (q.review.status === 'published' && !q.review.approvedBy) e.push('published needs approvedBy');
  return e;
}

export function checkContent(c: RawContent): CheckResult {
  const errors: LoadIssue[] = [...c.issues];
  const warnings: LoadIssue[] = [];
  const err = (file: string, message: string) => errors.push({ file, message });
  const warn = (file: string, message: string) => warnings.push({ file, message });

  const sourceIds = new Set(c.sources.map((s) => s.id));
  if (sourceIds.size !== c.sources.length) err('sources.json', 'duplicate source ids');

  const chapterIds = new Set(c.syllabus.chapters.map((x) => x.id));
  if (chapterIds.size !== c.syllabus.chapters.length) err('syllabus.json', 'duplicate chapter ids');

  const lessonIds = new Set<string>();
  for (const l of c.syllabus.lessons) {
    if (lessonIds.has(l.id)) err('syllabus.json', `duplicate lesson id ${l.id}`);
    lessonIds.add(l.id);
    if (!chapterIds.has(l.chapter)) err('syllabus.json', `${l.id}: unknown chapter ${l.chapter}`);
    if (!l.id.startsWith(l.chapter + '-')) err('syllabus.json', `${l.id}: id must start with chapter id`);
    // The source rule: no officialRef pointing at a listed source, no lesson.
    if (!sourceIds.has(l.officialRef.source)) err('syllabus.json', `${l.id}: officialRef.source "${l.officialRef.source}" is not in sources.json`);
  }

  const seenQ = new Set<string>();
  let questions = 0;
  let questionsPublished = 0;
  const checkSet = (file: string, qs: ContentQuestionInput[]) => {
    for (const q of qs) {
      questions++;
      if (q.review.status === 'published') questionsPublished++;
      if (seenQ.has(q.id)) err(file, `duplicate question id ${q.id}`);
      seenQ.add(q.id);
      if (q.passageId && !c.passages.has(q.passageId)) err(file, `${q.id}: passage ${q.passageId} missing`);
      for (const m of checkQuestion(q, c.passages)) err(file, `${q.id}: ${m}`);
    }
  };

  let lessonsPublished = 0;
  for (const [id, l] of c.lessons) {
    const file = `lessons/${id}.json`;
    if (!lessonIds.has(id)) err(file, 'lesson is not in syllabus.json — no official source, no lesson');
    if (l.status === 'published') lessonsPublished++;
    const words = wordCount(l.rule);
    if (words > RULE_WORD_BUDGET && !l.lengthJustification)
      err(file, `rule is ${words} words (budget ${RULE_WORD_BUDGET}); shorten it or add lengthJustification`);
    checkSet(file, l.checks);
    if (l.status === 'published') {
      const set = c.questionSets.get(id);
      if (!set || set.length < 10) err(file, `published lesson needs a practice set of ≥ 10 questions (has ${set?.length ?? 0})`);
    }
  }

  for (const [setId, qs] of c.questionSets) {
    const file = `questions/${setId}.json`;
    if (!lessonIds.has(setId) && !/^[qvwt]\d-(test|pool)/.test(setId)) err(file, 'question set id is neither a syllabus lesson nor a chapter pool (e.g. q1-test)');
    for (const q of qs) if (q.lessonId !== setId) err(file, `${q.id}: lessonId "${q.lessonId}" != file set "${setId}"`);
    checkSet(file, qs);
  }

  for (const [id, p] of c.passages) {
    const words = p.paragraphs.join(' ').split(/\s+/).length;
    if (words > 600) warn(`passages/${id}.json`, `passage is ${words} words`);
  }

  const missing = c.syllabus.lessons.filter((l) => !c.lessons.has(l.id)).length;
  if (missing) warn('syllabus.json', `${missing} syllabus lessons have no lesson file yet`);

  return {
    errors,
    warnings,
    stats: {
      chapters: c.syllabus.chapters.length,
      lessonsInSyllabus: c.syllabus.lessons.length,
      lessonsWritten: c.lessons.size,
      lessonsPublished,
      questions,
      questionsPublished,
      passages: c.passages.size,
    },
  };
}
