/**
 * SAR Prep service worker (v4).
 *
 * Goals: pages open instantly on a slow line, and everything the learner has
 * opened (or saved with "Save for offline") keeps working with no connection.
 * Only same-origin GET requests are handled. Anything that carries auth or
 * progress (/api/, server actions) is never touched, so a stale cache can
 * never shadow real data.
 *
 *  - Navigations: network first, but only for a few seconds. On a failing or
 *    very slow connection the cached copy is shown instead of a spinner.
 *    Unknown pages get a friendly /offline page, never a wrong page.
 *  - Practice sets (/exam/<id>) are identical for every ?mode=…, so they are
 *    stored once, under the bare path.
 *  - Next.js client-side navigations (?_rsc=…) get a short timeout; when they
 *    fail, Next falls back to a normal navigation, which the rule above serves.
 *  - Static assets (/_next/static, icons, fonts, words.json): cache first.
 */

// The cache name is deliberately NOT bumped with the code: renaming it would delete everything the learner
// saved for offline on each update. Pages are replaced by the network copy; assets are hashed, so old ones are harmless.
const VERSION = 'sar-prep-v4';
const PRECACHE = [
  '/',
  '/offline',
  '/learn',
  '/practice',
  '/review',
  '/stats',
  '/mock',
  '/plan',
  '/writing',
  '/settings',
  '/more',
  '/games',
  '/flashcards',
  '/words.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];
const NAV_TIMEOUT_MS = 4000;
const RSC_TIMEOUT_MS = 6000;

/** Scripts, styles and fonts a page needs to start: a cached page without them opens but cannot run offline. */
function assetsOf(html) {
  const found = new Set();
  const re = /(?:\/_next\/)?(static\/(?:chunks|css|media)\/[A-Za-z0-9_\-./%~[\]]+\.(?:js|css|woff2))/g;
  for (const m of html.matchAll(re)) found.add('/_next/' + m[1]);
  return [...found];
}

async function precache(cache, url) {
  const res = await fetch(url);
  if (!res.ok) return;
  await cache.put(url, res.clone());
  if ((res.headers.get('content-type') || '').includes('text/html')) {
    const assets = assetsOf(await res.text());
    await Promise.allSettled(assets.map((a) => cache.match(a).then((hit) => hit || fetch(a).then((r) => r.ok && cache.put(a, r)))));
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      // Individual failures must not abort the whole install.
      .then((cache) => Promise.allSettled(PRECACHE.map((u) => precache(cache, u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

function isBypassed(url) {
  return url.origin !== self.location.origin || url.pathname.startsWith('/api/');
}

/** Practice sets ignore the query string; ad-hoc sets (/exam/custom?ids=…) cannot be shared. */
function cacheKey(url) {
  if (url.pathname.startsWith('/exam/') && !url.pathname.startsWith('/exam/custom')) return url.origin + url.pathname;
  return url.origin + url.pathname + url.search;
}

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });
}

async function put(key, response) {
  const cache = await caches.open(VERSION);
  await cache.put(key, response);
}

async function handleNavigation(request, url) {
  const key = cacheKey(url);
  try {
    const res = await withTimeout(fetch(request), NAV_TIMEOUT_MS);
    // Never cache an error page: offline would then show it as if it were the lesson.
    if (res.ok) put(key, res.clone());
    return res;
  } catch {
    const hit = await caches.match(key);
    if (hit) return hit;
    // The network may just be slow: give it one more chance before the offline page.
    try {
      const res = await fetch(request);
      if (res.ok) put(key, res.clone());
      return res;
    } catch {
      return (await caches.match('/offline')) || Response.error();
    }
  }
}

async function handleRsc(request) {
  try {
    return await withTimeout(fetch(request), RSC_TIMEOUT_MS);
  } catch {
    // Next.js treats a failed fetch as "navigate the normal way", which we serve from cache.
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

async function handleAsset(request) {
  const hit = await caches.match(request);
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.type === 'basic') put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (isBypassed(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request, url));
    return;
  }
  if (request.headers.get('RSC') || url.searchParams.has('_rsc')) {
    event.respondWith(handleRsc(request));
    return;
  }

  // Pages fetched by "Save for offline" and the quiet pre-loading (not navigations).
  if (request.headers.get('X-Offline-Save') === '1') {
    event.respondWith(
      fetch(request).then((res) => {
        if (res.ok) put(cacheKey(url), res.clone());
        return res;
      })
    );
    return;
  }

  event.respondWith(handleAsset(request));
});
