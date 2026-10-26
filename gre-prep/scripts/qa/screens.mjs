/* Visual QA: screenshot every route at the widths in PLAN §6.5 and fail on
 * horizontal overflow.
 *
 *   npm run screens -- [--base http://localhost:3000] [--routes /,/learn]
 *
 * Playwright and its Chromium are preinstalled in the dev container; do not
 * run `playwright install`. Output: screenshots/<date>/<route>@<width>.png
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
};

const base = arg('base', 'http://localhost:3000');
const routes = arg('routes', '/').split(',');
const WIDTHS = [360, 390, 430, 768, 1024, 1280, 1440, 1920];
const out = path.join('screenshots', new Date().toISOString().slice(0, 10));
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch();
let failures = 0;

for (const route of routes) {
  for (const width of WIDTHS) {
    const height = width < 768 ? 800 : 900;
    const ctx = await browser.newContext({
      viewport: { width, height },
      isMobile: width < 768,
      hasTouch: width < 1024,
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    await page.goto(base + route, { waitUntil: 'networkidle' }).catch(() => {});
    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    const name = `${route === '/' ? 'home' : route.replace(/\W+/g, '_').replace(/^_|_$/g, '')}@${width}`;
    await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
    if (scrollWidth > innerWidth + 1) {
      failures++;
      console.error(`OVERFLOW ${route} @${width}: scrollWidth ${scrollWidth} > ${innerWidth}`);
    }
    await ctx.close();
  }
}

await browser.close();
console.log(`${routes.length * WIDTHS.length} screenshots in ${out}; ${failures} overflow failure(s)`);
process.exit(failures ? 1 : 0);
