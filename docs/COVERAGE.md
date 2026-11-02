# Coverage of the official syllabus

How the Learn course maps onto the ETS sources, and what was missing. Re-run the audit when lessons or topics change.

## Quant — ETS *GRE Math Review* (sections 1.1–4.6)

Every one of the 28 sections of the Math Review has at least one lesson (column 3). "Examples cited" counts the book's numbered
examples that a topic in `content/topics.json` names in its `etsRef`; uncited examples were read one by one and are covered in
concept by a lesson rule or a topic that cites the section rather than the example number.

| Section | Lessons | # | Topics hosted | Examples cited |
|---|---|---|---|---|
| 1.1 Integers | q1-01-factors-multiples, q1-02-divisibility-primes, q1-03-remainders-parity, q1-16-prime-factorization-tools, q1-17-divisibility-reasoning, q1-18-remainders-units-digits | 6 | 44 | 20/20 |
| 1.2 Fractions | q1-04-fraction-operations, q1-05-mixed-fractional, q1-19-fraction-techniques | 3 | 11 | 11/12 |
| 1.3 Exponents and Roots | q1-06-exponents, q1-07-roots, q1-20-powers-roots-size-sign, q1-21-radical-arithmetic | 4 | 24 | 0/0 |
| 1.4 Decimals | q1-08-decimals, q1-22-decimal-expansions | 2 | 10 | 3/7 |
| 1.5 Real Numbers | q1-09-number-line-abs, q1-10-real-properties, q1-23-absolute-value-equations, q1-24-operations-and-signs, q1-27-associative-identity-laws | 5 | 21 | 0/3 |
| 1.6 Ratio | q1-11-ratio, q2-19-variation-scaling, q1-25-ratio-techniques | 3 | 23 | 1/1 |
| 1.7 Percent | q1-12-percent, q1-13-percent-change, q1-26-percent-techniques | 3 | 19 | 13/16 |
| 2.1 Algebraic Expressions | q2-01-expressions | 1 | 4 | 4/15 |
| 2.2 Rules of Exponents | q2-02-exponent-rules, q2-20-sums-of-powers | 2 | 13 | 0/0 |
| 2.3 Solving Linear Equations | q2-03-linear-one-var, q2-04-linear-two-var, q2-21-equation-shortcuts | 3 | 16 | 3/3 |
| 2.4 Solving Quadratic Equations | q2-05-quadratic-factoring, q2-06-quadratic-formula | 2 | 6 | 5/5 |
| 2.5 Solving Linear Inequalities | q2-07-inequalities, q2-22-inequality-reasoning | 2 | 11 | 2/2 |
| 2.6 Functions | q2-08-functions, q2-18-defined-operations | 2 | 13 | 2/3 |
| 2.7 Applications | q2-09-word-problems, q2-10-average-rate-work, q2-11-mixtures, q2-12-interest, q2-23-word-problem-setups, q2-24-distance-rate-time, q2-25-work-rates | 7 | 43 | 12/12 |
| 2.8 Coordinate Geometry | q2-13-coordinate-basics, q2-14-lines, q2-15-graphing-curves, q2-26-coordinate-plane-skills | 4 | 22 | 4/6 |
| 2.9 Graphs of Functions | q2-16-function-graphs, q2-27-piecewise-root-functions | 2 | 0 | 0/7 |
| 3.1 Lines and Angles | q3-01-lines-angles | 1 | 3 | 0/0 |
| 3.2 Polygons | q3-02-polygons | 1 | 4 | 0/0 |
| 3.3 Triangles | q3-03-triangles-pythagoras, q3-04-special-triangles, q3-05-congruent-similar, q3-10-angle-and-side-facts | 4 | 20 | 0/0 |
| 3.4 Quadrilaterals | q3-06-quadrilaterals, q3-11-composite-quadrilaterals | 2 | 11 | 0/0 |
| 3.5 Circles | q3-07-circles-basics, q3-08-circles-lines, q3-12-circles-inscribed-figures | 3 | 15 | 0/0 |
| 3.6 Three-Dimensional Figures | q3-09-solids | 1 | 3 | 0/0 |
| 4.1 Methods for Presenting Data | q4-01-tables-bars, q4-02-graph-types, q4-13-reading-tricky-displays | 3 | 19 | 6/13 |
| 4.2 Numerical Methods for Describing Data | q4-03-centre-spread-basic, q4-04-position, q4-05-std-dev, q4-14-centre-spread-reasoning | 4 | 28 | 9/9 |
| 4.3 Counting Methods | q4-06-sets-venn, q4-07-counting-principles, q4-15-overlapping-sets, q4-16-arrangements, q4-17-selections | 5 | 45 | 4/6 |
| 4.4 Probability | q4-08-probability-basics, q4-09-independent-conditional, q4-18-probability-rules | 3 | 17 | 2/7 |
| 4.5 Distributions of Data, Random Variables, and Probability Distributions | q4-10-random-variables, q4-11-normal | 2 | 1 | 2/4 |
| 4.6 Data Interpretation Examples | q4-12-di-examples | 1 | 1 | 3/3 |

## Findings

| Math Review item | Finding | Action |
|---|---|---|
| 1.5 Property 2 (associative law) | Not stated in `q1-10-real-properties` (the other properties are) | New lesson `q1-27-associative-identity-laws` (draft) |
| 2.9 Examples 2.9.3–2.9.4, 2.9.7 (piecewise-defined and square-root functions) | `q2-16-function-graphs` teaches shifts and stretches only | New lesson `q2-27-piecewise-root-functions` (draft) |
| 2.9, 4.5 | Lessons `q2-16` and `q4-10` are published but host no checklist topic | Open item: add topics (needs published questions tagged with them) |

Everything else in the Math Review — terms, like terms, degree and polynomials (2.1), intervals and absolute value (1.5), terminating
and repeating decimals (lessons q1-08 and q1-22), percents above 100% and percent change (1.7), quadratics by factoring and by formula (2.4),
the four graphing topics of 2.8, probability rules and the normal distribution (4.4/4.5), and the figures and graph types of 4.1 — is
taught by an existing lesson and practised by its question set.

## Other official sources

| Source | Lessons |
|---|---|
| ETS Quantitative Reasoning overview, conventions, calculator | chapter `q0` (formats, strategies, calculator, conventions, DI sets) |
| ETS Verbal Reasoning (Text Completion, Sentence Equivalence, Reading Comprehension) | chapters `v0`–`v3`, vocabulary in `v4` |
| ETS Analytical Writing (Analyze an Issue — the only task on the current test) | chapter `w1` |
| Test day, scoring, retake policy | chapter `t1` |

## Practice from the books

- The **69 exercises** of the Math Review are available to the owner as a private self-assessed deck (`/math-review`), typed as text with their official
  answers. They are the book's own questions, kept separate from the original practice sets above.
- The **two full-length practice tests** of the ETS Official Guide are available to the owner privately under `/official-tests` (computer-delivered
  style, scored 130–170, with the official explanations).

## Not in scope (ETS says so)

Trigonometry, calculus, proofs, inferential statistics, anything beyond a second algebra course.

## Verbal audit against the Official Guide

The Official Guide's Verbal chapter was read against Learn (v0–v4). Every format and tip it lists is already taught — the three RC
formats (select one / select all / select in passage with the paragraph arrow), main vs minor points, reported vs advanced ideas,
hedges, transitions, inference, assumptions and perspective, strengths/weaknesses and alternative explanations, TC with one to three
blanks, SE. The one gap was reading **multi-paragraph passages** (ETS: "one or two are several paragraphs long", up to six questions),
now covered by the draft lesson `v3-09-long-passages` (two original three-paragraph passages, 12 questions, 2 checks). Drafts need the
blind-solve pipeline (`content:blind` → solvers → `content:solved`) before they can be published.
