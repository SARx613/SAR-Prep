# Authoring guide (lessons and questions)

Read `docs/PLAN.md` §3, §5 and §9 first. This file is the working checklist.

## Layout

```
gre-prep/content/
  sources.json                 closed list of official ETS sources (do not add)
  syllabus.json                chapters + lesson stubs: id, title, officialRef, objectives
  lessons/<lessonId>.json      lesson body (template enforced by src/content/schema.ts)
  questions/<lessonId>.json    practice set for that lesson: array of questions
  passages/<passageId>.json    RC passages
```

Validate often: `cd gre-prep && npm run content:check -- --only <prefix>` (e.g. `--only q2-`).
Exemplar to copy: `content/lessons/q1-01-factors-multiples.json` and `content/questions/q1-01-factors-multiples.json`.

## Hard rules

1. **Source.** The lesson topic must be inside its `officialRef` in `syllabus.json`. Read the official text first
   (see "Reference texts"). If the official source does not cover something, do not teach it. If you think a
   `syllabus.json` entry is wrong, fix its `officialRef`/objectives only when the source text proves it; never add a
   lesson without a source in `sources.json`.
2. **Never copy.** The ETS documents are copyrighted. Paraphrase concepts; write your own examples, numbers and
   sentences. Never reuse a sample question or its numbers.
3. **No filler, but 100% understood.** `rule` ≤ 120 words (math excluded). If two lines suffice, use two lines.
   Test: *could someone who reads only this lesson solve every question in its practice set?* If not, add what is
   missing. If a sentence can go without changing any answer, cut it.
4. **English only.** No French anywhere.
5. **Out of scope** (ETS says so): trigonometry, calculus, proofs, inferential statistics, anything beyond a second
   algebra course.

## Lesson file

Fields: `id`, `status` (`draft` — never set `published`), `why` (1 sentence), `rule`, optional `lengthJustification`,
`examples` (1–2, each with `prompt`, `steps[]`, `answer`), `trap` (1–3 lines), `checks` (2–3 inline questions; ids
`<lessonId>-c1`, `-c2`, `-c3`). Rich text: Markdown subset (`**bold**`, `*italic*`, `- lists`, blank line = paragraph)
and KaTeX between single `$…$`. In JSON strings escape backslashes: `"$\\frac{1}{2}$"`. **Money is not math:** a dollar amount is written `\$5` in the rendered text, i.e. `"\\$5"` inside the JSON string; an unescaped `$` swallows text up to the next `$` as maths. Prose never goes inside `$…$` (use `\text{…}` for units, e.g. `$12\text{ cm}$`; in JSON `"$12\\text{ cm}$"`).

## Practice set (`questions/<lessonId>.json`)

- **12 questions** per lesson (chapter-level formats lessons may use 10). Ids `<lessonId>-01` … `-12`; `lessonId` equals the file name.
- Difficulty ladder: 2×d1, 3×d2, 3×d3, 2×d4, 2×d5 (adjust ±1 where the topic is thin). d5 = hard GRE level.
- Mix formats **as the real GRE would for the topic**: PS select-one (5 choices), PS select-all, QC (the four fixed
  choices; use the standard stem shown in the exemplar), NE (integer / decimal / fraction), and DI where the topic has data.
- Every question: `explanation` that teaches the shortest correct route, `choiceExplanations` for every wrong choice id
  (select-one) or per wrong/misleading choice (select-all), `estSeconds` (45–150), `skills[]`, `topics[]` (ids from `content/topics.json`, see below), and
  `review: {"status":"draft","solvedBy":[],"sourceChecked":false}`.
- Distractors must come from **real mistakes** (sign error, forgetting to halve, using the product instead of the LCM…).
  Exactly one defensible answer. Numbers must make the item well-defined (no division by zero, integer answers where
  the format says integer).
- Order choices as the GRE does for numbers: increasing. Use `$…$` for any maths, including choices.
- NE: set `format`, and `unit`/`round` only when the stem says so. Keep stems explicit about rounding.
- Figures (geometry/DI): field `figure` with `kind` `bar|line|pie|table|scatter|svg`. For geometry use `svg`:
  one self-contained `<svg viewBox="0 0 W H">` using only `line, circle, polygon, polyline, path, text, rect`;
  stroke `currentColor`, no fills except `none`/`currentColor` at low opacity, no scripts, labels in `<text>`.
  Remember ETS: figures are **not necessarily to scale** unless coordinate systems/graphs; add a note when relevant.
- Quant stems for QC always use the standard stem. For DI, put the shared data in `figure` and repeat it in each
  question of the set (same figure object).

## Verbal specifics

- **TC**: 1–5 sentences, 1–3 blanks marked `{{1}}`, `{{2}}`, `{{3}}`. One blank → 5 choices; 2–3 blanks → 3 choices per
  blank, ids `1A,1B,1C`, `2A,…`. No partial credit.
- **SE**: one sentence, one blank `{{1}}`, **6** choices, exactly two keys giving sentences of the same meaning. The four
  distractors must **not** contain a second same-meaning pair, and at least one distractor should be a synonym of a key
  that does *not* fit the sentence (the ETS trap).
- **RC**: passages are original (paraphrase real graduate-level prose style; do not quote any text). Fields: physical
  sciences, biological sciences, social sciences, business, arts & humanities, everyday. 1–3 paragraphs,
  100–300 words typical. Questions per passage: 1–6. **select-one has 5 choices; select-all has exactly 3 choices
  (1–3 correct); select-in-passage** answer is a sentence copied verbatim from the (optionally `paragraphIndex`)
  paragraph. Every answer must be supported by the passage alone.
- Vocabulary: GRE-level (educated, not obscure). The vocabulary list in `public/words.json` is a good pool, not a rule.

## Reference texts (extracted from the official ETS documents, for reading only — do not commit, do not quote)

Folder: `/tmp/claude-0/-home-user-SAR-Prep/7164e49b-e907-5cc7-8c6d-40cc39fbd4ce/scratchpad/ets/`
`mathreview.txt` (Math Review 2024, section numbers match `officialRef.section`), `conventions.txt`, `calc.txt`,
`quantitative-reasoning.txt`, `verbal-reasoning.txt`, `analytical-writing.txt`, `issue.txt`, `scoring.txt`,
`issue-sample.txt`, `structure.html` (see `txt.py`).

## Pipeline (who sets what)

Author writes drafts → **Independent Solvers** (two, blind to keys) confirm every key → **Source Checker** confirms
scope and originality → **Pedagogy Editor** trims/approves → only then `status: published`. Authors never set
`verified`/`published` and never edit `review`.

## Topic checklist (`content/topics.json`)

`topics.json` lists every concept, technique, trap and question pattern a Quant learner must meet (about 480). Each topic has
a hosting lesson (`lessonId`). Every question and lesson check tags the topics it tests in `topics[]`; a topic counts as covered when
at least one *published* question carries it. `npm run content:check -- --topics` fails while any topic is uncovered (CI runs it).
A lesson page shows its topics with a tick once the learner has answered a tagged question correctly. When you add a topic, host it in
an existing lesson only if that lesson's rule can teach it in a line; otherwise add a new supplement lesson.
