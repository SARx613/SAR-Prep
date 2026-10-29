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

/** Downloads every page listed by /api/offline-manifest (plus the maths fonts), four at a time. */
export async function saveAll(onProgress?: (done: number, total: number) => void): Promise<void> {
  const { urls: pages } = (await (await fetch('/api/offline-manifest')).json()) as { urls: string[] };
  const urls = [...pages, ...fontUrls()];
  onProgress?.(0, urls.length);
  let saved = 0;
  for (let i = 0; i < urls.length; i += 4) {
    const results = await Promise.all(urls.slice(i, i + 4).map((u) => savePage(u)));
    saved += results.filter(Boolean).length;
    onProgress?.(Math.min(urls.length, i + 4), urls.length);
  }
  try { localStorage.setItem(SAVED_KEY, JSON.stringify({ at: Date.now(), pages: saved })); } catch { /* storage blocked */ }
}

const SAVED_KEY = 'sar-offline-saved';
const CACHE = 'sar-prep-v4';

/** What is really on the device: the cache is the truth, the stored note only says when we last saved. */
export async function offlineStatus(): Promise<{ at: number; pages: number; intact: boolean } | null> {
  try {
    const note = JSON.parse(localStorage.getItem(SAVED_KEY) ?? 'null') as { at: number; pages: number } | null;
    if (!note) return null;
    const have = (await (await caches.open(CACHE)).keys()).length;
    return { ...note, intact: have >= note.pages * 0.9 };
  } catch {
    return null;
  }
}

const AUTO_EVERY_MS = 7 * 24 * 3600 * 1000;

/** On a normal connection, downloads everything once and then refreshes it weekly, so offline works without a manual step. */
export async function autoSave(): Promise<void> {
  if (!canSaveQuietly()) return;
  try {
    const status = await offlineStatus();
    // Refresh weekly, and straight away if the browser emptied the cache.
    if (status?.intact && Date.now() - status.at < AUTO_EVERY_MS) return;
    await saveAll();
  } catch { /* offline or storage blocked: the next launch retries */ }
}
