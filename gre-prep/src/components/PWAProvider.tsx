'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker and asks the browser to keep our storage.
 *
 * The persistence request matters more than it looks: Safari evicts
 * localStorage for sites untouched for 7 days, which would wipe local
 * progress. `navigator.storage.persist()` exempts us from that eviction.
 * Cloud sync remains the real safety net for signed-in users.
 */
export default function PWAProvider() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .catch((e) => console.warn('[PWA] SW registration failed:', e));
    }

    if (navigator.storage?.persist) {
      navigator.storage
        .persisted()
        .then((already) => (already ? true : navigator.storage.persist()))
        .then((granted) => console.log('[PWA] Persistent storage:', granted))
        .catch((e) => console.warn('[PWA] Persistence request failed:', e));
    }
  }, []);

  return null;
}
