@AGENTS.md

# SAR Prep — working notes

- Product plan: `../docs/PLAN.md`; status: `../docs/STATUS.md`; content rules: `../docs/AUTHORING.md`, `../docs/REVIEW.md`.
- Everything the learner sees is **English**. No payments. No invented topics: every lesson needs an `officialRef`.
- Lessons and questions are JSON under `content/`, validated by `npm run content:check` (schema in `src/content/schema.ts`).
  Never edit an answer key without re-running the blind-solve pipeline (`content:blind` → solvers → `content:solved`).
- Exam screens (`src/components/exam/`) use the `.exam` token scope (always light). Learn screens use the semantic tokens in
  `src/styles-tokens.css` — never raw colours.
- Before any UI change: `npm run lint && npm run typecheck && npm test`, then `npm run screens` and `npm run flows` against `next dev`/`next start`.
- Use `fuser -k 3100/tcp` to free the dev port; do not `pkill -f` patterns that match your own shell command.
