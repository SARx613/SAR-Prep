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

## Private study mode (ETS material, never shipped)

This repository contains the **code** for two features that use ETS's own copyrighted material, but **not the material**. It lives in
`gre-prep/private/` (data in `official-tests/` and `math-review.json`, figures in `media/`), a submodule of a private repository, and is read at
request time. Access is closed by default: the pages, the server actions and the figure route (`/private-media/…`) answer 404 unless
`PRIVATE_STUDY_OPEN=1` is set (owner mode, for a local server) or the signed-in Google account is listed in `PRIVATE_STUDY_EMAILS`
(comma-separated). The nav entries appear only for allowed users. A public build has no `private/` folder and shows nothing.

| Route | What it is |
|---|---|
| `/official-tests` | The two full-length tests of the *Official Guide to the GRE General Test* (3rd ed.), run like the computer-delivered exam: a clock per section, Mark / Review, calculator, optional break, 130–170 score, official explanations. Answers stay on the server (`src/app/actions/official.ts`); results are kept in the browser. |
| `/math-review` | The exercises of the ETS *GRE Math Review*, typed as text with their official answers, self-assessed. |

**Online, for the owner only.** `gre-prep/private` is a Git submodule of the private repository `SARx613/SAR-Prep-private` (clone with
`--recurse-submodules`). Vercel cannot read private submodules, so its build fetches the repository itself with `scripts/fetch-private.mjs`:
set `PRIVATE_REPO_TOKEN` (a fine-grained GitHub token with read-only "Contents" access to that one repository) in the Vercel project's
environment variables. Access is then limited to the accounts in `private/allowed-emails.json` (kept in the private repository) and
`PRIVATE_STUDY_EMAILS`; everyone else gets a 404. `/build-info.json` tells whether the build found the material. Never make the private
repository public.

The public product stays original: the bank in `content/` is authored from the official *skills and formats*, never from ETS text. To
rebuild the private data from your own copies of the PDFs (not committed): `python3 -I scripts/content/build_exams.py <Official Guide PDF>`
and `python3 -I scripts/content/build_math_course.py <Math Review PDF>` (needs poppler, Pillow with WebP, PyMuPDF, and the transcription
modules in `gre-prep/private/scripts/`; figures go to `private/media/`).

GRE® is a registered trademark of ETS. SAR Prep is not affiliated with or endorsed by ETS.
