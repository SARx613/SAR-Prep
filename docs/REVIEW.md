# Review protocol: Source Checker + Pedagogy Editor

Run after two independent blind solvers have confirmed every key (see `docs/AUTHORING.md`, "Pipeline").
One reviewer takes a set of lessons and, for **each lesson**, does both jobs below, then writes a verdict file.

## 1. Source check (scope and originality)

Open the official text named by the lesson's `officialRef` (extracted texts: see AUTHORING.md "Reference texts").

- **Scope.** Every concept the lesson teaches, and every technique a practice question *requires*, must be (a) covered by the
  cited section, (b) an elementary consequence of it (e.g. GCD×LCM = product), or (c) taught in an earlier lesson of the
  syllabus. Anything else is out of source: remove it from the lesson, or tell the maintainer which question must be
  rewritten. ETS excludes trigonometry, calculus, proofs, inferential statistics.
- **Originality.** No sentence of 8+ words copied from the ETS text, and no ETS sample question or its numbers.
- **Facts.** Statements about the test (times, counts, formats, calculator, scoring) must match the ETS pages exactly.

## 2. Pedagogy edit (the "100% understood, zero filler" test)

- Read the lesson, then **every** practice question and check. For each one ask: *could a learner who has read only this
  lesson (plus earlier syllabus lessons) solve it?* If a technique is missing, add the shortest possible line to `rule`
  (or a step to an example). Keep `rule` ≤ 120 words (math excluded) or add a `lengthJustification`.
- Cut anything that can go without changing a single answer. No motivational text, no repetition of the same point.
- `why` is one sentence about where it appears on the GRE. `trap` is the real classic mistake, 1–3 lines.
- Worked examples must be correct and each step must follow from the previous one.
- Check KaTeX renders sensibly (balanced `$`, no prose inside math, money escaped).

You may edit **only the lesson file** (`content/lessons/<id>.json`: `why`, `rule`, `lengthJustification`, `examples`, `trap`).
Never edit a question, an answer key, `review` fields, the syllabus or the schema; report problems with questions instead.
After edits run `npm run content:check -- --only <lessonId>` until clean.

## 3. Verdict file

Write `<scratchpad>/reviews/<lessonId>.json`:

```json
{
  "lesson": "q1-01-factors-multiples",
  "verdict": "approve" | "revise",
  "scope": "ok" | "fixed" | "problem",
  "originality": "ok" | "problem",
  "lessonEdits": ["what you changed, one line each"],
  "questionProblems": [{ "id": "…", "problem": "…", "suggestedFix": "…" }],
  "notes": "optional"
}
```

`approve` = lesson now satisfies both jobs and no question needs a change. `revise` = something outside your remit remains
(a question out of scope, wrong, or untaught). The maintainer applies approvals with `npm run content:approve`.
