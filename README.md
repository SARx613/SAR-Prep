# SAR Prep

A free, English-only GRE preparation platform: official-syllabus chapters, short lessons, and practice questions in the exact formats of the real test, on desktop and on phones.

The product plan lives in [`docs/PLAN.md`](docs/PLAN.md); what is built and how content is verified is in [`docs/STATUS.md`](docs/STATUS.md).

## Stack

Next.js 16 (App Router) · React 19 · Tailwind 4 · Auth.js (Google) · Neon Postgres + Drizzle · Framer Motion · PWA.
Lessons and questions are content-as-code under `gre-prep/content/` (validated by Zod at build time); the database holds only user data.

> Next.js 16 differs from older versions. Read `gre-prep/node_modules/next/dist/docs/` before changing framework-level code.

## Develop

```bash
cd gre-prep
npm ci --legacy-peer-deps
cp .env.example .env.local      # DATABASE_URL, AUTH_SECRET, AUTH_GOOGLE_ID/SECRET
npm run dev
```

| Command | What it does |
|---|---|
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Vitest (grading, generators, content schema, scheduling) |
| `npm run content:check` | Validates every lesson and question in `content/` (schema, GRE format rules, sources, duplicates) |
| `npm run content:blind` / `content:solved` | Blind-solve pipeline: export questions without keys, record independent solvers' agreement |
| `npm run content:originality -- --refs <dir>` | Fails if 8+ consecutive words are copied from the ETS texts in `<dir>` |
| `npm run content:approve` | Publishes lessons that cleared solvers + source/pedagogy review |
| `npm run flows` | Answers every question format at phone/tablet/desktop widths and screenshots it |
| `npm run screens -- --routes /,/learn` | Screenshots each route at 8 widths (360–1920) and fails on horizontal overflow |

## Rules for content

- Every lesson carries an `officialRef` pointing at an ETS source in `content/sources.json`. No source, no lesson.
- Lessons follow one template and a word budget (see the plan, §3.2).
- Questions are original. Never copy text from ETS or any prep company.

GRE® is a registered trademark of ETS. SAR Prep is not affiliated with or endorsed by ETS.
