/* Arithmetic templates: percents, ratios, interest, rates, mixtures,
 * integer properties. Distractors encode the specific mistakes these
 * topics invite (reversing a percent base, averaging two speeds, and so
 * on) so that a wrong answer tells the reader which error they made. */

import { clean, fmt, fmtMoney, fmtPercent } from './format';
import { numericItem } from './build';
import type { Template } from './types';

/* ── Percent change ───────────────────────────────────────────────────── */

const percentChange: Template = {
  id: 'arith.percent-change',
  type: 'PS',
  topic: 'arithmetic',
  subtopic: 'percent',
  difficulties: [1, 2, 3],
  build: (rng, difficulty) => {
    const base = rng.int(2, 20) * 50;
    const up = rng.pick([10, 15, 20, 25, 30, 40, 50]);
    const down = rng.pick([10, 15, 20, 25, 30]);

    const afterUp = base * (1 + up / 100);
    const final = afterUp * (1 - down / 100);
    const net = clean(((final - base) / base) * 100);

    const item = rng.pick(['shirt', 'bicycle', 'desk', 'camera', 'printer']);

    return numericItem(rng, {
      type: 'PS',
      topic: 'arithmetic',
      subtopic: 'percent',
      difficulty,
      stem: `The price of a ${item} was increased by ${up} percent, and the new price was then decreased by ${down} percent. The final price is what percent greater or less than the original price?`,
      explanation:
        `Take the original price to be ${fmtMoney(base)}. After the ${up}% increase the price is ` +
        `${fmtMoney(base)} × ${clean(1 + up / 100)} = ${fmtMoney(clean(afterUp))}. ` +
        `The ${down}% decrease applies to that new price, not to the original: ` +
        `${fmtMoney(clean(afterUp))} × ${clean(1 - down / 100)} = ${fmtMoney(clean(final))}. ` +
        `The net change is (${fmtMoney(clean(final))} − ${fmtMoney(base)}) ÷ ${fmtMoney(base)} = ${fmtPercent(net)}. ` +
        `The two percents cannot simply be subtracted, because each is taken on a different base.`,
      tags: ['percent', 'percent-change', 'successive-change'],
      template: 'arith.percent-change',
      numeric: {
        correct: net,
        // Subtracting the percents; reversing the sign; applying the second
        // percent to the original base; adding the percents.
        distractors: [
          up - down,
          down - up,
          clean(((base * (1 + up / 100) - base * (down / 100) - base) / base) * 100),
          up + down,
          -(up + down),
        ],
        format: fmtPercent,
      },
    });
  },
};

/* ── Compound interest ────────────────────────────────────────────────── */

const compoundInterest: Template = {
  id: 'arith.compound-interest',
  type: 'PS',
  topic: 'arithmetic',
  subtopic: 'interest',
  difficulties: [2, 3, 4],
  build: (rng, difficulty) => {
    const principal = rng.int(2, 20) * 500;
    const rate = rng.pick([4, 5, 6, 8, 10]);
    const years = rng.int(2, 3);

    const compound = principal * Math.pow(1 + rate / 100, years);
    const interest = Math.round(compound - principal);
    const simple = Math.round(principal * (rate / 100) * years);

    return numericItem(rng, {
      type: 'PS',
      topic: 'arithmetic',
      subtopic: 'interest',
      difficulty,
      stem: `${fmtMoney(principal)} is invested at an annual interest rate of ${rate} percent, compounded annually. To the nearest dollar, how much interest will the investment earn in ${years} years?`,
      explanation:
        `Compounding multiplies the balance by (1 + r) each year, so after ${years} years the balance is ` +
        `${fmtMoney(principal)} × (1 + ${clean(rate / 100)})^${years} = ${fmtMoney(clean(compound))}. ` +
        `The question asks for the interest earned, not the final balance, so subtract the principal: ` +
        `${fmtMoney(clean(compound))} − ${fmtMoney(principal)} = ${fmtMoney(interest)}. ` +
        `Simple interest would have given only ${fmtMoney(simple)}, since compounding lets each year's interest earn interest of its own.`,
      tags: ['interest', 'compound', 'exponential-growth'],
      template: 'arith.compound-interest',
      numeric: {
        correct: interest,
        // Simple interest; the final balance; one year's interest; balance
        // computed with simple interest; one year too few.
        distractors: [
          simple,
          Math.round(compound),
          Math.round(principal * (rate / 100)),
          simple + principal,
          Math.round(principal * Math.pow(1 + rate / 100, years - 1) - principal),
        ],
        format: fmtMoney,
      },
    });
  },
};

/* ── Ratios ───────────────────────────────────────────────────────────── */

const ratioParts: Template = {
  id: 'arith.ratio-parts',
  type: 'PS',
  topic: 'arithmetic',
  subtopic: 'ratio',
  difficulties: [1, 2, 3],
  build: (rng, difficulty) => {
    const [a, b] = rng.sample([2, 3, 4, 5, 7, 8, 9], 2);
    const unit = rng.int(3, 25);
    const total = (a + b) * unit;
    const larger = Math.max(a, b) * unit;
    const smaller = Math.min(a, b) * unit;

    const ctx = rng.pick([
      { thing: 'marbles', x: 'red', y: 'blue' },
      { thing: 'books', x: 'hardcover', y: 'paperback' },
      { thing: 'tickets', x: 'adult', y: 'child' },
    ]);
    const askedLabel = a > b ? ctx.x : ctx.y;

    return numericItem(rng, {
      type: 'PS',
      topic: 'arithmetic',
      subtopic: 'ratio',
      difficulty,
      stem: `A box contains ${fmt(total)} ${ctx.thing}, each of which is either ${ctx.x} or ${ctx.y}. The ratio of ${ctx.x} ${ctx.thing} to ${ctx.y} ${ctx.thing} is ${a} to ${b}. How many ${askedLabel} ${ctx.thing} are in the box?`,
      explanation:
        `A ratio of ${a} to ${b} divides the box into ${a} + ${b} = ${a + b} equal parts. ` +
        `Since there are ${fmt(total)} ${ctx.thing} in all, each part is ${fmt(total)} ÷ ${a + b} = ${fmt(unit)} ${ctx.thing}. ` +
        `The ${askedLabel} ${ctx.thing} account for ${Math.max(a, b)} of those parts, so there are ` +
        `${Math.max(a, b)} × ${fmt(unit)} = ${fmt(larger)}. ` +
        `A common error is to read ${a} and ${b} as counts rather than as parts of the whole.`,
      tags: ['ratio', 'proportion', 'parts-of-whole'],
      template: 'arith.ratio-parts',
      numeric: {
        correct: larger,
        // The other group; the total; the difference; half the total.
        distractors: [
          smaller,
          total,
          larger - smaller,
          Math.round(total / 2),
          Math.max(a, b) * (unit + 1),
        ],
        format: fmt,
      },
    });
  },
};

/* ── Average speed ────────────────────────────────────────────────────── */

const averageSpeed: Template = {
  id: 'arith.average-speed',
  type: 'PS',
  topic: 'arithmetic',
  subtopic: 'rate',
  difficulties: [3, 4],
  build: (rng, difficulty) => {
    const s1 = rng.pick([30, 40, 45, 50, 60]);
    const s2 = rng.pick([20, 25, 30, 36, 40].filter((s) => s !== s1));
    const dist = rng.int(1, 4) * 180; // divisible by every speed above

    const time = dist / s1 + dist / s2;
    const avg = clean((2 * dist) / time);
    const naive = clean((s1 + s2) / 2);

    return numericItem(rng, {
      type: 'PS',
      topic: 'arithmetic',
      subtopic: 'rate',
      difficulty,
      stem: `A cyclist rode from town P to town Q at an average speed of ${s1} kilometers per hour and returned along the same route at an average speed of ${s2} kilometers per hour. What was the cyclist's average speed, in kilometers per hour, for the round trip?`,
      explanation:
        `Average speed is total distance ÷ total time, never the average of the two speeds — the cyclist spends more time at the slower speed, so the answer must come out below ${fmt(naive)}. ` +
        `Take the one-way distance to be ${fmt(dist)} km. The outbound leg takes ${fmt(dist)} ÷ ${s1} = ${fmt(clean(dist / s1))} hours and the return leg takes ${fmt(dist)} ÷ ${s2} = ${fmt(clean(dist / s2))} hours, ` +
        `a total of ${fmt(clean(time))} hours to cover ${fmt(2 * dist)} km. ` +
        `So the average speed is ${fmt(2 * dist)} ÷ ${fmt(clean(time))} = ${fmt(avg)} km per hour. ` +
        `The distance cancels out, so any one-way distance gives the same answer.`,
      tags: ['rate', 'average-speed', 'harmonic-mean'],
      template: 'arith.average-speed',
      numeric: {
        correct: avg,
        // Averaging the speeds; either speed alone; half the harmonic mean.
        distractors: [naive, s1, s2, clean((s1 * s2) / (s1 + s2)), clean(avg + 2)],
        format: fmt,
      },
    });
  },
};

/* ── Mixtures ─────────────────────────────────────────────────────────── */

const mixture: Template = {
  id: 'arith.mixture',
  type: 'PS',
  topic: 'arithmetic',
  subtopic: 'mixture',
  difficulties: [3, 4, 5],
  build: (rng, difficulty) => {
    const vol = rng.int(2, 12) * 10;
    const conc = rng.pick([10, 20, 25, 40]);
    const target = rng.pick([50, 60, 75].filter((t) => t > conc));
    if (target === undefined) return null;

    // Adding pure solute: (conc·vol/100 + x) / (vol + x) = target/100
    const x = clean((vol * (target - conc)) / (100 - target));
    if (x <= 0 || x > 1000) return null;

    const startAcid = clean((conc * vol) / 100);

    return numericItem(rng, {
      type: 'PS',
      topic: 'arithmetic',
      subtopic: 'mixture',
      difficulty,
      stem: `A ${fmt(vol)}-liter solution is ${conc} percent acid by volume. How many liters of pure acid must be added to produce a solution that is ${target} percent acid by volume?`,
      explanation:
        `The solution starts with ${conc}% of ${fmt(vol)} = ${fmt(startAcid)} liters of acid. ` +
        `Adding x liters of pure acid raises both the acid and the total volume: the acid becomes ${fmt(startAcid)} + x and the total becomes ${fmt(vol)} + x. ` +
        `Setting the new concentration to ${target}% gives (${fmt(startAcid)} + x) ÷ (${fmt(vol)} + x) = ${clean(target / 100)}. ` +
        `Solving gives x = ${fmt(x)} liters. ` +
        `The trap is forgetting that the added acid also increases the denominator.`,
      tags: ['mixture', 'concentration', 'percent'],
      template: 'arith.mixture',
      numeric: {
        correct: x,
        // Treating the gap as a share of the original volume; ignoring the
        // rising denominator; doubling.
        distractors: [
          clean(vol * ((target - conc) / 100)),
          clean(vol * (target / 100)),
          clean((vol * (target - conc)) / 100),
          clean(x * 2),
          clean(vol - x),
        ],
        format: fmt,
      },
    });
  },
};

/* ── Integer properties (quantitative comparison) ─────────────────────── */

const remainderQC: Template = {
  id: 'arith.remainder-qc',
  type: 'QC',
  topic: 'arithmetic',
  subtopic: 'integer-properties',
  difficulties: [3, 4],
  build: (rng, difficulty) => {
    const divisor = rng.pick([3, 4, 5, 6, 7]);
    const remainder = rng.int(1, divisor - 1);
    const doubled = (2 * remainder) % divisor;

    return {
      type: 'QC',
      section: 'quant',
      topic: 'arithmetic',
      subtopic: 'integer-properties',
      difficulty,
      stem: 'Compare Quantity A and Quantity B.',
      content: {
        common: `When the positive integer n is divided by ${divisor}, the remainder is ${remainder}.`,
        quantityA: `The remainder when 2n is divided by ${divisor}`,
        quantityB: `${doubled}`,
      },
      answer: { choice: 'C' },
      explanation:
        `Write n = ${divisor}k + ${remainder} for some non-negative integer k. Then 2n = ${2 * divisor}k + ${2 * remainder}. ` +
        `The term ${2 * divisor}k is divisible by ${divisor}, so the remainder of 2n depends only on ${2 * remainder}, ` +
        `and ${2 * remainder} leaves a remainder of ${doubled} on division by ${divisor}. ` +
        `Because this argument holds for every valid n, the relationship is fixed and the answer is not "cannot be determined". ` +
        `Testing n = ${divisor + remainder} confirms it. The quantities are equal.`,
      tags: ['remainder', 'divisibility', 'integer-properties'],
      template: 'arith.remainder-qc',
    };
  },
};

export const arithmeticTemplates: Template[] = [
  percentChange,
  compoundInterest,
  ratioParts,
  averageSpeed,
  mixture,
  remainderQC,
];
