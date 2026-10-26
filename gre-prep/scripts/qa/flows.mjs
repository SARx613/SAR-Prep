/* Interaction QA for the exam player: opens specific questions, answers them,
 * checks the answer and screenshots viewport states at phone/tablet/desktop.
 *   npm run flows -- [--base http://localhost:3100]
 * Fails on horizontal overflow or a console error. */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const base = arg('base', 'http://localhost:3100');
const only = arg('only', null);
const out = path.join('screenshots', new Date().toISOString().slice(0, 10), 'flows');
fs.mkdirSync(out, { recursive: true });

// nth = zero-based question index inside the set.
const FLOWS = [
  { name: 'ne-calc', set: 'q1-01-factors-multiples', nth: 1, calc: true, type: '12' },
  { name: 'ps-select-all', set: 'q1-01-factors-multiples', nth: 4, pick: [0, 2] },
  { name: 'qc', set: 'q1-01-factors-multiples', nth: 3, pick: [2] },
  { name: 'tc', set: 'v1-02-method', nth: 0, pick: [0] },
  { name: 'tc-multi', set: 'v1-02-method', nth: 5, pickBlanks: true },
  { name: 'tc-3', set: 'v1-02-method', nth: 9, pickBlanks: true },
  { name: 'se', set: 'v2-01-structure', nth: 0, pick: [0, 1] },
  { name: 'rc-all', set: 'v3-01-formats', nth: 0, pick: [0] },
  { name: 'rc-one', set: 'v3-01-formats', nth: 1, pick: [0] },
  { name: 'rc-sentence', set: 'v3-01-formats', nth: 2, sentence: true },
  { name: 'di-one', set: 'q0-07-di-sets', nth: 1, pick: [0] },
  { name: 'di-num', set: 'q0-07-di-sets', nth: 0, fill: '5' },
];
const SIZES = [[390, 800], [768, 1000], [1280, 800]];
const browser = await chromium.launch();
let bad = 0;
for (const f of FLOWS) {
  if (only && f.name !== only) continue;
  for (const [w, h] of SIZES) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, isMobile: w < 768, hasTouch: w < 1024 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => { if (!/authjs|server configuration/.test(e.message)) errors.push(e.message); });
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|Hydration|Failed to load resource|authjs|server configuration|AuthError|ClientFetchError/.test(m.text())) errors.push(m.text()); });
    await page.goto(`${base}/exam/${f.set}?mode=tutor`, { waitUntil: 'networkidle' });
    await page.evaluate(() => sessionStorage.clear());
    for (let i = 0; i < f.nth; i++) { await page.keyboard.press('ArrowRight'); }
    await page.waitForTimeout(150);
    const shot = (s) => page.screenshot({ path: path.join(out, `${f.name}-${s}@${w}.png`) });
    await shot('1-open');
    if (f.calc) {
      const cb = page.getByRole('button', { name: /calculator/i }).first();
      if (await cb.count()) { await cb.click(); await page.waitForTimeout(150); await shot('2-calc'); await page.getByRole('button', { name: 'Close calculator' }).click(); }
      await page.getByLabel('Answer').fill(f.type);
    }
    if (f.fill) await page.getByLabel('Answer').fill(f.fill).catch(() => {});
    if (f.pick) {
      const rows = page.locator('label:has(input[type=radio]), label:has(input[type=checkbox])');
      for (const i of f.pick) await rows.nth(i).click();
    }
    if (f.pickBlanks) {
      for (const g of await page.locator('[role=radiogroup]').all()) await g.locator('label').first().click();
    }
    if (f.sentence) {
      if (w < 1024) await page.getByRole('tab', { name: 'Passage' }).click().catch(() => {});
      await page.locator('[role=button][aria-pressed]').first().click({ timeout: 4000 }).catch((e) => errors.push('no selectable sentence: ' + e.message.split('\n')[0]));
      if (w < 1024) await page.getByRole('tab', { name: 'Question' }).click().catch(() => {});
    }
    await page.waitForTimeout(100);
    await shot('3-answered');
    const check = page.getByRole('button', { name: 'Check answer' });
    if (await check.isEnabled().catch(() => false)) { await check.click(); await page.waitForTimeout(200); await shot('4-checked'); }
    const { sw, iw } = await page.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    if (sw > iw + 1) { bad++; console.error(`OVERFLOW ${f.name}@${w}: ${sw}>${iw}`); }
    if (errors.length) { bad++; console.error(`ERRORS ${f.name}@${w}:`, errors.slice(0, 3)); }
    await ctx.close();
  }
}
await browser.close();
console.log(`flows done, ${bad} problem(s); shots in ${out}`);
process.exit(bad ? 1 : 0);
