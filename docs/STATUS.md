# Implementation status

What exists, how it is checked, and what is still open. Updated with the code.

## Product (all in `gre-prep/`)

| Area | State |
|---|---|
| Learn: 12 chapters, 117 lessons (85 core + 32 supplements), each tied to an ETS source (`officialRef`); lesson pages list their topics and tick them off | done (content in `content/`) |
| Practice: 2 371 original questions in the real GRE formats; 476 checklist topics (`content/topics.json`) each have at least one published question, enforced by `content:check --topics` (TC 1/2/3 blanks, SE, RC ×3, QC, PS ×2, NE integer/decimal/fraction, DI) | done |
| Exam player: tutor and timed modes, Mark / Review / Back / Next, hideable timer, on-screen calculator (order of operations, 8 digits, ERROR rules, MR/MC/M+, Transfer Display), select-in-passage, keyboard shortcuts | done |
| Qbank with filters (section, type, chapter, difficulty, unseen / missed / due) | done |
| Progress: every checked answer is saved on the spot (tutor mode); a practice set reopens at the first unanswered question, earlier ones shown as done; the screen survives closing the app; signed-in users sync a few seconds after each answer | done |
| Review: spaced repetition of missed questions (1 and 3 days, two spaced successes) + error log with reasons | done |
| Stats: accuracy by chapter / type / difficulty, pace, weakest lessons, miss reasons | done |
| Mock tests ×6 + diagnostic: Verbal 12+15, Quant 12+15, section 2 adapts to section 1, estimated 130–170 score (clearly labelled as an estimate) | done |
| Study plan from exam date and weekly hours | done |
| Writing: 30-minute editor without spell-check, scoring-guide self-check, optional AI estimate (needs `ANTHROPIC_API_KEY`, signed-in users, daily cap) | done |
| Vocabulary (flashcards, series, games) kept as a TC/SE study aid; French translation off by default | done |
| Offline: service worker, "Save for offline" in Settings | done |
| Cloud sync of attempts and preferences (Neon): `attempt_log`, `user_state` | code + migrations done; **run `drizzle-kit migrate` on the real database** |
| Light / dark / system theme, exam screens always light | done |

## How content is kept honest

1. **Source rule** — `content:check` fails a lesson without a valid `officialRef` into `content/sources.json`.
2. **Blind double solve** — every question was answered by two independent solvers who never saw the key
   (`npm run content:blind` / `content:solved`); disagreements and "flawed" flags were fixed or rewritten.
3. **Source + pedagogy review** — each lesson was checked against the official text (scope, originality, "could the lesson alone
   solve every question") — protocol in `docs/REVIEW.md`; fixes re-verified blind.
4. **Publishing** — only questions with ≥ 2 solvers, `sourceChecked` and an approver are `published`; production shows published
   content only (`SAR_SHOW_DRAFTS=1` shows drafts).

## Checks (run in CI)

`npm run lint`, `npm run typecheck`, `npm test` (grading, calculator, generators, content rules, SRS, stats, sync merge,
mock composition and estimate, study plan), `npm run content:check`, `npm run build`.
Visual QA, run by hand: `npm run screens` (8 widths, fails on horizontal overflow) and `npm run flows` (answers every question
format at phone / tablet / desktop widths).

## Known limits and open items

- Scores in mocks are our own estimate; there is no official conversion table.
- Mock questions are drawn from the practice pool (not exclusive to mocks).
- Practice prompts for Writing are original; the real topics are in the ETS pool (linked, not copied).
- Wording of the six Issue instruction sets is paraphrased from the ETS page.
- No video. No payments (by design).
- Browser-level tests for the player run via `npm run flows`; a CI job for them is not set up.
