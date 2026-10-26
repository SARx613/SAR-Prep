/* Accessibility audit with axe-core: fails on serious/critical violations.
 *   npm run a11y -- [--base http://localhost:3101]
 * Uses the Chromium preinstalled in the dev container. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const { AxeBuilder } = require('@axe-core/playwright');
const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const base = arg('base', 'http://localhost:3101');
const ROUTES = ['/', '/learn', '/learn/q1', '/learn/q1/q1-01-factors-multiples', '/practice', '/review', '/stats', '/mock', '/plan', '/writing', '/settings', '/more',
  '/exam/q1-01-factors-multiples?mode=tutor', '/exam/v3-01-formats?mode=tutor', '/writing/session?prompt=p01'];
const browser = await chromium.launch();
let bad = 0;
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, colorScheme: theme });
  for (const r of ROUTES) {
    const page = await ctx.newPage();
    await page.goto(base + r, { waitUntil: 'networkidle' }).catch(() => {});
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    for (const v of res.violations.filter((x) => ['serious', 'critical'].includes(x.impact))) {
      bad++;
      console.error(`[${theme}] ${r}  ${v.id} (${v.impact}) — ${v.help}  e.g. ${v.nodes[0]?.target?.join(' ')}`);
    }
    await page.close();
  }
  await ctx.close();
}
await browser.close();
console.log(bad ? `${bad} serious/critical violation(s)` : 'no serious or critical accessibility violations');
process.exit(bad ? 1 : 0);
