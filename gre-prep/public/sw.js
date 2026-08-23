/**
 * SAR Prep service worker.
 *
 * Strategy is deliberately conservative: only same-origin GET navigations and
 * static assets are cached. Anything that carries auth or progress is never
 * intercepted, so a stale cache can never shadow real progress data.
 */

const VERSION = 'sar-prep-v1';
const PRECACHE = [
  '/',
  '/games',
  '/flashcards',
  '/words.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(VERSION)
      // Individual failures must not abort the whole install.
      .then((cache) => Promise.allSettled(PRECACHE.map((u) => cache.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

/**
 * Requests that must always hit the network, never the cache.
 *
 * The /api/ guard covers Auth.js, which serves its whole OAuth flow under
 * /api/auth/* — including the callback, a navigation carrying a single-use
 * ?code= that must never be replayed from cache. Server Actions POST to page
 * routes, but only GET is intercepted at all, so progress writes are untouched.
 */
function isBypassed(url) {
  return (
    url.origin !== self.location.origin || url.pathname.startsWith('/api/')
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (isBypassed(url)) return;

  // Navigations: network-first so deploys are picked up immediately,
  // falling back to cache (then the dashboard) when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches.match(request).then((hit) => hit || caches.match('/'))
        )
    );
    return;
  }

  // Static assets: cache-first, refreshed in the background.
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((res) => {
        if (res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(request, copy));
        }
        return res;
      });
    })
  );
});
