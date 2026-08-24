/* Geometry templates: triangles (including the special right triangles the
 * GRE leans on), circles, polygons, and solids. Dimensions are drawn so
 * that areas and lengths stay exact rather than landing on ugly radicals. */

import { clean, fmt } from './format';
import { numericItem } from './build';
import type { Template } from './types';

/* Pythagorean triples the GRE reuses constantly. */
const TRIPLES: readonly (readonly [number, number, number])[] = [
  [3, 4, 5],
  [5, 12, 13],
  [8, 15, 17],
  [7, 24, 25],
  [9, 40, 41],
] as const;

/* ── Right triangle ───────────────────────────────────────────────────── */

const rightTriangle: Template = {
  id: 'geo.right-triangle',
  type: 'PS',
  topic: 'geometry',
  subtopic: 'triangles',
  difficulties: [2, 3],
  build: (rng, difficulty) => {
    const [a0, b0, c0] = rng.pick(TRIPLES);
    const k = rng.int(1, 4);
    const [a, b, c] = [a0 * k, b0 * k, c0 * k];

    const ask = rng.pick(['hypotenuse', 'area', 'perimeter'] as const);
    const correct =
      ask === 'hypotenuse' ? c : ask === 'area' ? clean((a * b) / 2) : a + b + c;

    const known =
      ask === 'hypotenuse'
        ? `the legs have lengths ${fmt(a)} and ${fmt(b)}`
        : `the legs have lengths ${fmt(a)} and ${fmt(b)}`;

    const label = {
      hypotenuse: 'the length of the hypotenuse',
      area: 'the area of the triangle',
      perimeter: 'the perimeter of the triangle',
    }[ask];

    return numericItem(rng, {
      type: 'PS',
      topic: 'geometry',
      subtopic: 'triangles',
      difficulty,
      stem: `In a right triangle, ${known}. What is ${label}?`,
      explanation:
        `By the Pythagorean theorem, the hypotenuse satisfies c² = ${fmt(a)}² + ${fmt(b)}² = ${fmt(a * a)} + ${fmt(b * b)} = ${fmt(c * c)}, so c = ${fmt(c)}. ` +
        `This is a ${a0}-${b0}-${c0} triangle scaled by ${fmt(k)}; recognizing the triple saves the arithmetic. ` +
        (ask === 'area'
          ? `The area of a right triangle is half the product of its legs: (${fmt(a)} × ${fmt(b)}) ÷ 2 = ${fmt(correct)}. The hypotenuse plays no part in the area.`
          : ask === 'perimeter'
            ? `The perimeter is the sum of all three sides: ${fmt(a)} + ${fmt(b)} + ${fmt(c)} = ${fmt(correct)}.`
            : `So the hypotenuse is ${fmt(c)}.`),
      tags: ['triangles', 'pythagorean-theorem', 'right-triangle'],
      template: 'geo.right-triangle',
      numeric: {
        correct,
        // Confusing area with perimeter, using the full leg product, and
        // adding the legs without the hypotenuse.
        distractors: [
          a + b + c,
          clean((a * b) / 2),
          a * b,
          a + b,
          c,
          clean((a + b) / 2),
        ].filter((d) => d !== correct),
        format: fmt,
      },
    });
  },
};

/* ── Circle ───────────────────────────────────────────────────────────── */

const circle: Template = {
  id: 'geo.circle',
  type: 'PS',
  topic: 'geometry',
  subtopic: 'circles',
  difficulties: [1, 2, 3],
  build: (rng, difficulty) => {
    const r = rng.int(2, 12);
    const ask = rng.pick(['area', 'circumference'] as const);

    // Keep answers in terms of π so they stay exact.
    const correct = ask === 'area' ? r * r : 2 * r;
    const fmtPi = (n: number) => (n === 1 ? 'π' : `${fmt(n)}π`);

    return numericItem(rng, {
      type: 'PS',
      topic: 'geometry',
      subtopic: 'circles',
      difficulty,
      stem: `A circle has a radius of ${fmt(r)}. What is ${ask === 'area' ? 'the area' : 'the circumference'} of the circle?`,
      explanation:
        ask === 'area'
          ? `The area of a circle is πr². With r = ${fmt(r)}, the area is π × ${fmt(r)}² = ${fmtPi(r * r)}. ` +
            `The radius is squared, not doubled — confusing πr² with 2πr is the classic slip.`
          : `The circumference of a circle is 2πr. With r = ${fmt(r)}, the circumference is 2π × ${fmt(r)} = ${fmtPi(2 * r)}. ` +
            `Note that the circumference uses the radius once, while the area squares it.`,
      tags: ['circles', 'area', 'circumference'],
      template: 'geo.circle',
      numeric: {
        correct,
        // The other formula, diameter confusion, and forgetting the square.
        distractors: [r * r, 2 * r, r, 4 * r, clean(r * r * 2)].filter(
          (d) => d !== correct
        ),
        format: fmtPi,
      },
    });
  },
};

/* ── Polygon interior angles ──────────────────────────────────────────── */

const polygonAngles: Template = {
  id: 'geo.polygon-angles',
  type: 'PS',
  topic: 'geometry',
  subtopic: 'polygons',
  difficulties: [2, 3],
  build: (rng, difficulty) => {
    const n = rng.int(5, 12);
    const sum = (n - 2) * 180;
    const each = clean(sum / n);

    const ask = rng.pick(['sum', 'each'] as const);
    const correct = ask === 'sum' ? sum : each;

    const names: Record<number, string> = {
      5: 'pentagon',
      6: 'hexagon',
      7: 'heptagon',
      8: 'octagon',
      9: 'nonagon',
      10: 'decagon',
    };
    const name = names[n] ?? `polygon with ${n} sides`;

    return numericItem(rng, {
      type: 'PS',
      topic: 'geometry',
      subtopic: 'polygons',
      difficulty,
      stem: `What is ${ask === 'sum' ? 'the sum of the measures of the interior angles' : 'the measure, in degrees, of each interior angle'} of a regular ${name}?`,
      explanation:
        `A polygon with n sides can be cut into n − 2 triangles, each contributing 180°, so the interior angles sum to (n − 2) × 180°. ` +
        `With n = ${fmt(n)}, that is (${fmt(n)} − 2) × 180° = ${fmt(sum)}°. ` +
        (ask === 'each'
          ? `Because the polygon is regular, all ${fmt(n)} angles are equal, so each measures ${fmt(sum)}° ÷ ${fmt(n)} = ${fmt(each)}°. ` +
            `The word "regular" is what licenses that division — without it the angles need not be equal.`
          : `The question asks for the total, not the individual angle, so the answer is ${fmt(sum)}°.`),
      tags: ['polygons', 'interior-angles', 'regular-polygon'],
      template: 'geo.polygon-angles',
      numeric: {
        correct,
        // Using n instead of n−2, exterior angles, and mixing sum with each.
        distractors: [sum, each, n * 180, clean(360 / n), (n - 1) * 180].filter(
          (d) => d !== correct
        ),
        format: fmt,
      },
    });
  },
};

/* ── Solids ───────────────────────────────────────────────────────────── */

const rectangularSolid: Template = {
  id: 'geo.rectangular-solid',
  type: 'PS',
  topic: 'geometry',
  subtopic: 'solids',
  difficulties: [2, 3, 4],
  build: (rng, difficulty) => {
    const l = rng.int(2, 10);
    const w = rng.int(2, 10);
    const h = rng.int(2, 10);

    const volume = l * w * h;
    const surface = 2 * (l * w + l * h + w * h);

    const ask = rng.pick(['volume', 'surface'] as const);
    const correct = ask === 'volume' ? volume : surface;

    return numericItem(rng, {
      type: 'PS',
      topic: 'geometry',
      subtopic: 'solids',
      difficulty,
      stem: `A rectangular solid has dimensions ${fmt(l)} by ${fmt(w)} by ${fmt(h)}. What is ${ask === 'volume' ? 'the volume' : 'the total surface area'} of the solid?`,
      explanation:
        ask === 'volume'
          ? `The volume of a rectangular solid is the product of its three dimensions: ${fmt(l)} × ${fmt(w)} × ${fmt(h)} = ${fmt(volume)}.`
          : `A rectangular solid has three pairs of congruent faces, with areas ${fmt(l)} × ${fmt(w)} = ${fmt(l * w)}, ${fmt(l)} × ${fmt(h)} = ${fmt(l * h)}, and ${fmt(w)} × ${fmt(h)} = ${fmt(w * h)}. ` +
            `The total surface area is twice their sum: 2 × (${fmt(l * w)} + ${fmt(l * h)} + ${fmt(w * h)}) = ${fmt(surface)}. ` +
            `Forgetting to double — counting each face only once — is the usual error.`,
      tags: ['solids', ask === 'volume' ? 'volume' : 'surface-area', '3d'],
      template: 'geo.rectangular-solid',
      numeric: {
        correct,
        // The other measure, the undoubled surface, and the dimension sum.
        distractors: [
          volume,
          surface,
          l * w + l * h + w * h,
          l + w + h,
          2 * (l + w + h),
        ].filter((d) => d !== correct),
        format: fmt,
      },
    });
  },
};

/* ── Triangle inequality (QC) ─────────────────────────────────────────── */

const triangleInequalityQC: Template = {
  id: 'geo.triangle-inequality-qc',
  type: 'QC',
  topic: 'geometry',
  subtopic: 'triangles',
  difficulties: [3, 4],
  build: (rng, difficulty) => {
    const a = rng.int(4, 12);
    const b = rng.int(4, 12);
    // The third side lies strictly between |a−b| and a+b, so its exact
    // value is not determined — the answer is always D.
    const compare = rng.int(Math.abs(a - b) + 1, a + b - 1);

    return {
      type: 'QC',
      section: 'quant',
      topic: 'geometry',
      subtopic: 'triangles',
      difficulty,
      stem: 'Compare Quantity A and Quantity B.',
      content: {
        common: `Two sides of a triangle have lengths ${fmt(a)} and ${fmt(b)}.`,
        quantityA: 'The length of the third side',
        quantityB: `${fmt(compare)}`,
      },
      answer: { choice: 'D' },
      explanation:
        `By the triangle inequality, the third side must be greater than the difference of the other two and less than their sum: ` +
        `${fmt(Math.abs(a - b))} < third side < ${fmt(a + b)}. ` +
        `That range contains values both below and above ${fmt(compare)} — for instance ${fmt(Math.abs(a - b) + 0.5)} and ${fmt(a + b - 0.5)} are both admissible. ` +
        `Since the third side is not pinned to a single value, the comparison cannot be settled, and the answer is that the relationship cannot be determined. ` +
        `Assuming a right triangle, or reading the two given sides as legs, is what leads people to pick a definite answer here.`,
      tags: ['triangles', 'triangle-inequality', 'indeterminate'],
      template: 'geo.triangle-inequality-qc',
    };
  },
};

export const geometryTemplates: Template[] = [
  rightTriangle,
  circle,
  polygonAngles,
  rectangularSolid,
  triangleInequalityQC,
];
