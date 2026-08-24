/* Data analysis and data interpretation.
 *
 * DI items carry a figure and several questions read off the same data, the
 * way the real section presents them. Statistics templates cover mean,
 * median, range, standard-deviation reasoning, counting, and probability. */

import { clean, fmt, fmtPercent, reduce } from './format';
import { numericItem } from './build';
import type { NEContent, NEAnswer, SeriesFigureData } from '@/types/questions';
import type { GeneratedQuestion, Template } from './types';

/* ── Mean / median ────────────────────────────────────────────────────── */

const meanMedian: Template = {
  id: 'stat.mean-median',
  type: 'PS',
  topic: 'data-analysis',
  subtopic: 'statistics',
  difficulties: [2, 3],
  build: (rng, difficulty) => {
    const n = rng.pick([5, 7]);
    const values = Array.from({ length: n }, () => rng.int(2, 40));
    const sorted = [...values].sort((x, y) => x - y);

    const sum = values.reduce((a, b) => a + b, 0);
    const mean = clean(sum / n);
    const median = sorted[(n - 1) / 2];
    const range = sorted[n - 1] - sorted[0];

    const ask = rng.pick(['mean', 'median', 'range'] as const);
    const correct = ask === 'mean' ? mean : ask === 'median' ? median : range;

    return numericItem(rng, {
      type: 'PS',
      topic: 'data-analysis',
      subtopic: 'statistics',
      difficulty,
      stem: `The list ${values.map((v) => fmt(v)).join(', ')} contains ${fmt(n)} numbers. What is the ${ask} of the numbers in the list?`,
      explanation:
        `Sorted, the list reads ${sorted.map((v) => fmt(v)).join(', ')}. ` +
        (ask === 'mean'
          ? `The mean is the sum divided by the count: ${fmt(sum)} ÷ ${fmt(n)} = ${fmt(mean)}.`
          : ask === 'median'
            ? `With ${fmt(n)} values the median is the middle one once sorted — the ${(n + 1) / 2}th — which is ${fmt(median)}. ` +
              `Sorting first is essential; reading the middle of the unsorted list is the usual mistake.`
            : `The range is the largest value minus the smallest: ${fmt(sorted[n - 1])} − ${fmt(sorted[0])} = ${fmt(range)}.`),
      tags: ['statistics', ask, 'descriptive-statistics'],
      template: 'stat.mean-median',
      numeric: {
        correct,
        distractors: [mean, median, range, sorted[0], sorted[n - 1], clean(sum)].filter(
          (d) => d !== correct
        ),
        format: fmt,
      },
    });
  },
};

/* ── Probability ──────────────────────────────────────────────────────── */

const probability: Template = {
  id: 'stat.probability',
  type: 'PS',
  topic: 'data-analysis',
  subtopic: 'probability',
  difficulties: [3, 4],
  build: (rng, difficulty) => {
    const red = rng.int(3, 9);
    const blue = rng.int(3, 9);
    const green = rng.int(2, 6);
    const total = red + blue + green;

    // Probability that two draws without replacement are both red.
    const num = red * (red - 1);
    const den = total * (total - 1);
    const [rn, rd] = reduce(num, den);
    const correct = clean(num / den);

    const withReplacement = clean((red / total) * (red / total));

    return numericItem(rng, {
      type: 'PS',
      topic: 'data-analysis',
      subtopic: 'probability',
      difficulty,
      stem: `A jar contains ${fmt(red)} red marbles, ${fmt(blue)} blue marbles, and ${fmt(green)} green marbles. If two marbles are drawn at random without replacement, what is the probability that both are red?`,
      explanation:
        `There are ${fmt(total)} marbles in all. The first draw is red with probability ${fmt(red)}/${fmt(total)}. ` +
        `After removing one red marble, ${fmt(red - 1)} red marbles remain among ${fmt(total - 1)}, so the second draw is red with probability ${fmt(red - 1)}/${fmt(total - 1)}. ` +
        `Multiplying: (${fmt(red)}/${fmt(total)}) × (${fmt(red - 1)}/${fmt(total - 1)}) = ${fmt(rn)}/${fmt(rd)} ≈ ${fmt(correct)}. ` +
        `Because the draws are without replacement, both the numerator and the denominator drop by one on the second draw — treating the draws as independent gives ${fmt(withReplacement)}, which is the trap answer.`,
      tags: ['probability', 'without-replacement', 'dependent-events'],
      template: 'stat.probability',
      numeric: {
        correct,
        distractors: [
          withReplacement,
          clean(red / total),
          clean((red / total) * ((red - 1) / total)),
          clean((red + red - 1) / (total + total - 1)),
          clean((red * 2) / total),
        ].filter((d) => d !== correct),
        format: (n) => n.toFixed(3),
      },
    });
  },
};

/* ── Combinations ─────────────────────────────────────────────────────── */

function choose(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return Math.round(r);
}

const combinations: Template = {
  id: 'stat.combinations',
  type: 'PS',
  topic: 'data-analysis',
  subtopic: 'counting',
  difficulties: [3, 4],
  build: (rng, difficulty) => {
    const n = rng.int(5, 10);
    const k = rng.int(2, Math.min(4, n - 1));

    const combos = choose(n, k);
    const perms = combos * factorial(k);

    return numericItem(rng, {
      type: 'PS',
      topic: 'data-analysis',
      subtopic: 'counting',
      difficulty,
      stem: `A committee of ${fmt(k)} people is to be chosen from a group of ${fmt(n)} people. How many different committees are possible?`,
      explanation:
        `A committee is unordered — choosing A then B gives the same committee as choosing B then A — so this is a combination, not a permutation. ` +
        `The count is C(${fmt(n)}, ${fmt(k)}) = ${fmt(n)}! ÷ (${fmt(k)}! × ${fmt(n - k)}!) = ${fmt(combos)}. ` +
        `If order had mattered the answer would be ${fmt(perms)}, which is ${fmt(factorial(k))} times larger; dividing by ${fmt(k)}! is what removes the duplicate orderings.`,
      tags: ['counting', 'combinations', 'permutations'],
      template: 'stat.combinations',
      numeric: {
        correct: combos,
        distractors: [perms, n * k, choose(n, k - 1), choose(n - 1, k), factorial(k)].filter(
          (d) => d !== combos
        ),
        format: fmt,
      },
    });
  },
};

function factorial(n: number): number {
  let r = 1;
  for (let i = 2; i <= n; i++) r *= i;
  return r;
}

/* ── Numeric entry ────────────────────────────────────────────────────── */

const numericEntry: Template = {
  id: 'stat.numeric-entry',
  type: 'NE',
  topic: 'arithmetic',
  subtopic: 'percent',
  difficulties: [2, 3],
  build: (rng, difficulty): GeneratedQuestion => {
    const total = rng.int(4, 30) * 25;
    const pct = rng.pick([12, 16, 24, 32, 36, 44, 48]);
    const part = clean((pct / 100) * total);

    const content: NEContent = { format: 'integer' };
    const answer: NEAnswer = { value: part };

    return {
      type: 'NE',
      section: 'quant',
      topic: 'arithmetic',
      subtopic: 'percent',
      difficulty,
      stem: `In a survey of ${fmt(total)} people, ${fmt(pct)} percent reported owning a bicycle. How many of the people surveyed reported owning a bicycle?`,
      content,
      answer,
      explanation:
        `To take a percent of a number, multiply by the percent written as a decimal: ` +
        `${fmt(pct)}% of ${fmt(total)} is ${clean(pct / 100)} × ${fmt(total)} = ${fmt(part)}. ` +
        `The result counts people, so it must be a whole number — a fractional answer signals an arithmetic slip. ` +
        `Enter ${fmt(part)}.`,
      tags: ['percent', 'numeric-entry', 'survey'],
      template: 'stat.numeric-entry',
    };
  },
};

/* ── Data interpretation over a bar chart ─────────────────────────────── */

const YEARS = ['2019', '2020', '2021', '2022', '2023'];
const REGIONS = ['North', 'South', 'East', 'West'];

const dataInterpretation: Template = {
  id: 'di.bar-chart',
  type: 'DI',
  topic: 'data-analysis',
  subtopic: 'data-interpretation',
  difficulties: [2, 3, 4],
  build: (rng, difficulty) => {
    const region = rng.pick(REGIONS);
    const values = YEARS.map(() => rng.int(20, 200));

    const data: SeriesFigureData = {
      categories: [...YEARS],
      series: [{ name: `${region} region`, values }],
      xLabel: 'Year',
      yLabel: 'Units sold (thousands)',
      unit: 'thousand units',
    };

    const ask = rng.pick(['percent-change', 'total', 'greatest-increase'] as const);

    if (ask === 'percent-change') {
      const i = rng.int(0, YEARS.length - 2);
      const from = values[i];
      const to = values[i + 1];
      const change = clean(((to - from) / from) * 100);

      return numericItem(rng, {
        type: 'DI',
        topic: 'data-analysis',
        subtopic: 'data-interpretation',
        difficulty,
        stem: `According to the graph, the number of units sold in the ${region} region changed by approximately what percent from ${YEARS[i]} to ${YEARS[i + 1]}?`,
        explanation:
          `Read the two bars: ${YEARS[i]} shows ${fmt(from)} thousand units and ${YEARS[i + 1]} shows ${fmt(to)} thousand units. ` +
          `Percent change is (new − old) ÷ old × 100, always measured against the earlier value: ` +
          `(${fmt(to)} − ${fmt(from)}) ÷ ${fmt(from)} × 100 = ${fmtPercent(change)}. ` +
          `Dividing by the later value instead of the earlier one is the standard error on this question type.`,
        tags: ['data-interpretation', 'percent-change', 'bar-chart'],
        template: 'di.bar-chart',
        numeric: {
          correct: change,
          distractors: [
            clean(((to - from) / to) * 100),
            clean(to - from),
            -change,
            clean((to / from) * 100),
            clean(((to - from) / from) * 10),
          ].filter((d) => d !== change),
          format: fmtPercent,
        },
        figure: {
          kind: 'bar',
          title: `Units sold in the ${region} region, ${YEARS[0]}–${YEARS[YEARS.length - 1]}`,
          data,
        },
      });
    }

    if (ask === 'total') {
      const sum = values.reduce((a, b) => a + b, 0);
      const mean = clean(sum / values.length);

      return numericItem(rng, {
        type: 'DI',
        topic: 'data-analysis',
        subtopic: 'data-interpretation',
        difficulty,
        stem: `According to the graph, what was the average (arithmetic mean) number of units sold per year in the ${region} region over the ${fmt(YEARS.length)} years shown, in thousands?`,
        explanation:
          `Read all ${fmt(YEARS.length)} bars: ${values.map((v) => fmt(v)).join(', ')} thousand units. ` +
          `Their total is ${fmt(sum)} thousand. ` +
          `The mean is that total divided by the number of years: ${fmt(sum)} ÷ ${fmt(YEARS.length)} = ${fmt(mean)} thousand units. ` +
          `Reporting the total rather than the average is the trap here.`,
        tags: ['data-interpretation', 'mean', 'bar-chart'],
        template: 'di.bar-chart',
        numeric: {
          correct: mean,
          distractors: [
            sum,
            clean(sum / (YEARS.length - 1)),
            Math.max(...values),
            Math.min(...values),
            clean(mean * 2),
          ].filter((d) => d !== mean),
          format: fmt,
        },
        figure: {
          kind: 'bar',
          title: `Units sold in the ${region} region, ${YEARS[0]}–${YEARS[YEARS.length - 1]}`,
          data,
        },
      });
    }

    // greatest-increase: which consecutive pair rose the most?
    let bestIdx = 0;
    let bestJump = -Infinity;
    for (let i = 0; i < values.length - 1; i++) {
      const jump = values[i + 1] - values[i];
      if (jump > bestJump) {
        bestJump = jump;
        bestIdx = i;
      }
    }
    if (bestJump <= 0) return null;

    const correctText = `${YEARS[bestIdx]} to ${YEARS[bestIdx + 1]}`;
    const options = YEARS.slice(0, -1).map((y, i) => `${y} to ${YEARS[i + 1]}`);
    const choices = options.map((text, i) => ({
      id: String.fromCharCode(65 + i),
      text,
    }));
    const correctId = choices[bestIdx].id;

    return {
      type: 'DI',
      section: 'quant',
      topic: 'data-analysis',
      subtopic: 'data-interpretation',
      difficulty,
      stem: `According to the graph, between which two consecutive years did the number of units sold in the ${region} region increase the most?`,
      content: { format: 'select_one', choices },
      answer: { choices: [correctId] },
      explanation:
        `Compare the year-over-year changes: ` +
        values
          .slice(0, -1)
          .map(
            (v, i) =>
              `${YEARS[i]}→${YEARS[i + 1]}: ${fmt(values[i + 1])} − ${fmt(v)} = ${fmt(values[i + 1] - v)}`
          )
          .join('; ') +
        `. The largest increase is ${fmt(bestJump)} thousand units, from ${correctText}. ` +
        `The question asks for the largest absolute increase, not the largest value or the steepest percent change — a tall bar is not the same as a big jump.`,
      tags: ['data-interpretation', 'trends', 'bar-chart'],
      template: 'di.bar-chart',
      figure: {
        kind: 'bar',
        title: `Units sold in the ${region} region, ${YEARS[0]}–${YEARS[YEARS.length - 1]}`,
        data,
      },
    };
  },
};

export const dataTemplates: Template[] = [
  meanMedian,
  probability,
  combinations,
  numericEntry,
  dataInterpretation,
];
