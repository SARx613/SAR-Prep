/* Helpers for keeping pages on the device. The service worker stores any
 * request that carries the X-Offline-Save header (see public/sw.js). */

const SAVE = { headers: { 'X-Offline-Save': '1' } } as const;

const warmed = new Set<string>();

/** The scripts and styles a saved page needs to start: without them a cached page opens but cannot run offline. */
function assetsOf(html: string): string[] {
  const found = new Set<string>();
  for (const m of html.matchAll(/(?:\/_next\/)?(static\/(?:chunks|css|media)\/[A-Za-z0-9_\-./%~[\]]+\.(?:js|css|woff2))/g)) found.add(`/_next/${m[1]}`);
  return [...found];
}

export async function savePage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, SAVE);
    if (!res.ok) return false;
    if ((res.headers.get('content-type') ?? '').includes('text/html')) {
      const todo = assetsOf(await res.text()).filter((a) => !warmed.has(a));
      for (const a of todo) warmed.add(a);
      // Plain fetches: the service worker keeps every static asset it sees.
      await Promise.all(todo.map((a) => fetch(a).catch(() => warmed.delete(a))));
    }
    return true;
  } catch {
    return false;
  }
}

/** The font files behind the KaTeX stylesheet: they load lazily, so a learner who never saw maths online would lack them offline. */
export function fontUrls(): string[] {
  const urls = new Set<string>();
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of Array.from(rules)) {
      if (rule.type !== CSSRule.FONT_FACE_RULE) continue;
      const src = (rule as CSSFontFaceRule).style.getPropertyValue('src');
      for (const m of src.matchAll(/url\(["']?([^"')]+\.woff2)["']?\)/g)) urls.add(new URL(m[1], sheet.href ?? location.href).pathname);
    }
  }
  return [...urls];
}

export const canSaveQuietly = () =>
  typeof navigator !== 'undefined' && navigator.onLine && !(navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData;
