/* Algebra templates: linear systems, quadratics, exponents, inequalities,
 * functions, and coordinate geometry. Parameters are drawn so that answers
 * stay clean integers or simple fractions, the way real GRE items do. */

import { clean, fmt, term } from './format';
import { numericItem } from './build';
import { buildTextChoices } from './format';
import type { Template } from './types';

/* ── Linear system ────────────────────────────────────────────────────── */

const linearSystem: Template = {
  id: 'alg.linear-system',
  type: 'PS',
  topic: 'algebra',
  subtopic: 'linear-equations',
  difficulties: [2, 3],
  build: (rng, difficulty) => {
    // Choose the solution first, then build equations that hit it.
    const x = rng.int(-8, 9);
    const y = rng.int(-8, 9);
    const a1 = rng.nonZeroInt(-5, 5);
    const b1 = rng.nonZeroInt(-5, 5);
    const a2 = rng.nonZeroInt(-5, 5);
    const b2 = rng.nonZeroInt(-5, 5);
    if (a1 * b2 - a2 * b1 === 0) return null; // parallel or identical

    const c1 = a1 * x + b1 * y;
    const c2 = a2 * x + b2 * y;

    const target = rng.pick(['x', 'y', 'x + y', 'xy'] as const);
    const correct =
      target === 'x' ? x : target === 'y' ? y : target === 'x + y' ? x + y : x * y;

    const eq = (a: number, b: number, c: number) =>
      `${term(a, 'x', true)}${term(b, 'y')} = ${fmt(c)}`;

    return numericItem(rng, {
      type: 'PS',
      topic: 'algebra',
      subtopic: 'linear-equations',
      difficulty,
      stem: `If ${eq(a1, b1, c1)} and ${eq(a2, b2, c2)}, what is the value of ${target}?`,
      explanation:
        `Solve the system by elimination. Multiplying the first equation by ${fmt(a2)} and the second by ${fmt(a1)} makes the x-terms match, and subtracting eliminates x, giving y = ${fmt(y)}. ` +
        `Substituting back into ${eq(a1, b1, c1)} gives x = ${fmt(x)}. ` +
        `Check both equations: ${eq(a1, b1, c1)} and ${eq(a2, b2, c2)} both hold at (${fmt(x)}, ${fmt(y)}). ` +
        `The question asks for ${target}, which is ${fmt(correct)} — read the last line carefully, since solving for x and stopping is the most common slip.`,
      tags: ['linear-system', 'simultaneous-equations', 'substitution'],
      template: 'alg.linear-system',
      numeric: {
        correct,
        // The other variable, the other combinations, and a sign flip.
        distractors: [x, y, x + y, x * y, -correct, x - y].filter(
          (d) => d !== correct
        ),
        format: fmt,
      },
    });
  },
};

/* ── Quadratic roots ──────────────────────────────────────────────────── */

const quadratic: Template = {
  id: 'alg.quadratic',
  type: 'PS',
  topic: 'algebra',
  subtopic: 'quadratic-equations',
  difficulties: [2, 3, 4],
  build: (rng, difficulty) => {
    // Build from the roots so the quadratic always factors.
    const r1 = rng.int(-9, 9);
    const r2 = rng.int(-9, 9);
    if (r1 === r2) return null;

    const b = -(r1 + r2);
    const c = r1 * r2;

    const ask = rng.pick(['sum', 'product', 'larger', 'smaller'] as const);
    const correct =
      ask === 'sum'
        ? r1 + r2
        : ask === 'product'
          ? r1 * r2
          : ask === 'larger'
            ? Math.max(r1, r2)
            : Math.min(r1, r2);

    const label = {
      sum: 'the sum of the roots',
      product: 'the product of the roots',
      larger: 'the greater root',
      smaller: 'the lesser root',
    }[ask];

    const poly = `x²${term(b, 'x')}${term(c, '')} = 0`;

    return numericItem(rng, {
      type: 'PS',
      topic: 'algebra',
      subtopic: 'quadratic-equations',
      difficulty,
      stem: `If ${poly}, what is ${label}?`,
      explanation:
        `Factor the quadratic. Look for two numbers whose product is ${fmt(c)} and whose sum is ${fmt(-b)}: those are ${fmt(r1)} and ${fmt(r2)}. ` +
        `So ${poly.replace(' = 0', '')} = (x ${r1 >= 0 ? '−' : '+'} ${fmt(Math.abs(r1))})(x ${r2 >= 0 ? '−' : '+'} ${fmt(Math.abs(r2))}), and the roots are x = ${fmt(r1)} and x = ${fmt(r2)}. ` +
        `Therefore ${label} is ${fmt(correct)}. ` +
        `As a check, for x² + bx + c the roots always sum to −b = ${fmt(-b)} and multiply to c = ${fmt(c)}.`,
      tags: ['quadratic', 'factoring', 'roots'],
      template: 'alg.quadratic',
      numeric: {
        correct,
        // The other root, the sign-flipped sum, the raw coefficients.
        distractors: [r1, r2, r1 + r2, r1 * r2, -correct, b, c].filter(
          (d) => d !== correct
        ),
        format: fmt,
      },
    });
  },
};

/* ── Exponent rules (QC) ──────────────────────────────────────────────── */

const exponentQC: Template = {
  id: 'alg.exponent-qc',
  type: 'QC',
  topic: 'algebra',
  subtopic: 'exponents',
  difficulties: [3, 4],
  build: (rng, difficulty) => {
    const base = rng.pick([2, 3, 5]);
    const p = rng.int(3, 8);
    const q = rng.int(2, 5);

    // Quantity A: base^p · base^q   Quantity B: base^(p+q) — always equal,
    // or perturbed to make one side genuinely larger.
    const perturb = rng.pick([0, 0, 1, -1]);
    const expA = p + q;
    const expB = p + q + perturb;

    const choice = expA > expB ? 'A' : expA < expB ? 'B' : 'C';

    return {
      type: 'QC',
      section: 'quant',
      topic: 'algebra',
      subtopic: 'exponents',
      difficulty,
      stem: 'Compare Quantity A and Quantity B.',
      content: {
        quantityA: `${base}^${p} · ${base}^${q}`,
        quantityB: `${base}^${expB}`,
      },
      answer: { choice },
      explanation:
        `Multiplying powers of the same base adds the exponents: ${base}^${p} · ${base}^${q} = ${base}^(${p} + ${q}) = ${base}^${expA}. ` +
        `Quantity B is ${base}^${expB}. Since the base ${base} is greater than 1, the larger exponent gives the larger value, ` +
        `so comparing the two reduces to comparing ${expA} with ${expB}. ` +
        (choice === 'C'
          ? `They are equal, so the two quantities are equal.`
          : `Because ${expA} ${expA > expB ? '>' : '<'} ${expB}, Quantity ${choice} is greater.`) +
        ` There is no need to compute either power.`,
      tags: ['exponents', 'exponent-rules', 'comparison'],
      template: 'alg.exponent-qc',
    };
  },
};

/* ── Inequalities ─────────────────────────────────────────────────────── */

const inequality: Template = {
  id: 'alg.inequality',
  type: 'PS',
  topic: 'algebra',
  subtopic: 'inequalities',
  difficulties: [3, 4],
  build: (rng, difficulty) => {
    // a·x + b < c  with a negative, so the inequality must flip.
    const a = -rng.int(2, 6);
    const b = rng.int(-10, 10);
    const xBound = rng.int(-6, 6);
    const c = a * xBound + b;

    // a is negative: a·x + b < c  ⟺  x > xBound
    const correctText = `x > ${fmt(xBound)}`;
    const distractors = [
      `x < ${fmt(xBound)}`,
      `x ≥ ${fmt(xBound)}`,
      `x > ${fmt(-xBound)}`,
      `x < ${fmt(-xBound)}`,
      `x > ${fmt(clean((c - b) / Math.abs(a)))}`,
    ];

    const { choices, correctId } = buildTextChoices(rng, correctText, distractors);

    return {
      type: 'PS',
      section: 'quant',
      topic: 'algebra',
      subtopic: 'inequalities',
      difficulty,
      stem: `If ${term(a, 'x', true)}${term(b, '')} < ${fmt(c)}, which of the following describes all possible values of x?`,
      content: { format: 'select_one', choices },
      answer: { choices: [correctId] },
      explanation:
        `Isolate x. Subtracting ${fmt(b)} from both sides gives ${term(a, 'x', true)} < ${fmt(c - b)}. ` +
        `Now divide both sides by ${fmt(a)}. Because ${fmt(a)} is negative, the direction of the inequality reverses, giving x > ${fmt(xBound)}. ` +
        `Forgetting to flip the sign when dividing by a negative number is the single most common error on inequality questions. ` +
        `Check with a value: x = ${fmt(xBound + 1)} satisfies the original inequality, while x = ${fmt(xBound - 1)} does not.`,
      tags: ['inequalities', 'sign-flip', 'algebraic-manipulation'],
      template: 'alg.inequality',
    };
  },
};

/* ── Line through two points ──────────────────────────────────────────── */

const lineSlope: Template = {
  id: 'alg.line-slope',
  type: 'PS',
  topic: 'algebra',
  subtopic: 'coordinate-geometry',
  difficulties: [2, 3],
  build: (rng, difficulty) => {
    const x1 = rng.int(-8, 8);
    const y1 = rng.int(-8, 8);
    const dx = rng.nonZeroInt(-6, 6);
    const dy = rng.nonZeroInt(-6, 6);
    const x2 = x1 + dx;
    const y2 = y1 + dy;

    const slope = clean(dy / dx);
    const intercept = clean(y1 - slope * x1);

    const ask = rng.pick(['slope', 'intercept'] as const);
    const correct = ask === 'slope' ? slope : intercept;

    return numericItem(rng, {
      type: 'PS',
      topic: 'algebra',
      subtopic: 'coordinate-geometry',
      difficulty,
      stem: `In the xy-plane, a line passes through the points (${fmt(x1)}, ${fmt(y1)}) and (${fmt(x2)}, ${fmt(y2)}). What is the ${ask === 'slope' ? 'slope of the line' : 'y-intercept of the line'}?`,
      explanation:
        `The slope is the change in y over the change in x: (${fmt(y2)} − ${fmt(y1)}) ÷ (${fmt(x2)} − ${fmt(x1)}) = ${fmt(dy)} ÷ ${fmt(dx)} = ${fmt(slope)}. ` +
        (ask === 'slope'
          ? `Inverting the fraction — computing Δx over Δy — is the usual mistake.`
          : `Now substitute one point into y = mx + b: ${fmt(y1)} = ${fmt(slope)} × ${fmt(x1)} + b, so b = ${fmt(intercept)}. ` +
            `The y-intercept is the value of y where x = 0, so the answer is ${fmt(intercept)}.`),
      tags: ['coordinate-geometry', 'slope', 'linear-equations'],
      template: 'alg.line-slope',
      numeric: {
        correct,
        // Inverted slope, sign flips, the other quantity.
        distractors: [
          clean(dx / dy),
          -slope,
          slope,
          intercept,
          -intercept,
          clean(y1 + slope * x1),
        ].filter((d) => Number.isFinite(d) && d !== correct),
        format: fmt,
      },
    });
  },
};

/* ── Function evaluation ──────────────────────────────────────────────── */

const functionEval: Template = {
  id: 'alg.function-eval',
  type: 'PS',
  topic: 'algebra',
  subtopic: 'functions',
  difficulties: [2, 3, 4],
  build: (rng, difficulty) => {
    const a = rng.nonZeroInt(-4, 5);
    const b = rng.nonZeroInt(-8, 8);
    const c = rng.int(-8, 8);
    const input = rng.int(-5, 5);

    // f(x) = a·x² + b·x + c
    const f = (t: number) => a * t * t + b * t + c;
    const correct = f(input);

    const poly = `${term(a, 'x²', true)}${term(b, 'x')}${term(c, '')}`;

    return numericItem(rng, {
      type: 'PS',
      topic: 'algebra',
      subtopic: 'functions',
      difficulty,
      stem: `The function f is defined by f(x) = ${poly}. What is the value of f(${fmt(input)})?`,
      explanation:
        `Substitute x = ${fmt(input)} throughout. ` +
        `The squared term gives ${fmt(a)} × (${fmt(input)})² = ${fmt(a)} × ${fmt(input * input)} = ${fmt(a * input * input)}. ` +
        `The linear term gives ${fmt(b)} × ${fmt(input)} = ${fmt(b * input)}. ` +
        `Adding the constant: ${fmt(a * input * input)} + ${fmt(b * input)} + ${fmt(c)} = ${fmt(correct)}. ` +
        (input < 0
          ? `Note that (${fmt(input)})² is positive — squaring a negative input is where this kind of question catches people out.`
          : `Work term by term rather than all at once, to keep the signs straight.`),
      tags: ['functions', 'substitution', 'quadratic'],
      template: 'alg.function-eval',
      numeric: {
        correct,
        // Squaring wrongly (losing the sign), dropping the constant, and
        // applying the coefficient before squaring.
        distractors: [
          a * -(input * input) + b * input + c,
          a * input * input + b * input,
          Math.pow(a * input, 2) + b * input + c,
          f(-input),
          f(input + 1),
        ].filter((d) => d !== correct),
        format: fmt,
      },
    });
  },
};

export const algebraTemplates: Template[] = [
  linearSystem,
  quadratic,
  exponentQC,
  inequality,
  lineSlope,
  functionEval,
];
