import { useSyncExternalStore } from 'react';

/**
 * Reads a localStorage-backed value the way React wants an external store
 * read: no mount effect, no cascading render, and it picks up a write from
 * another tab. Snapshots are cached per key, so parsing does not hand React
 * a fresh object on every render (which would loop).
 *
 * `serverValue` is what server rendering and the hydration pass see, so it
 * must be a stable module-level constant, not an object literal.
 */

const CHANGE_EVENT = 'gre-prep:storage';

const cache = new Map<string, { raw: string | null; value: unknown }>();

function subscribe(onChange: () => void): () => void {
  // `storage` only fires in *other* tabs; the custom event covers this one.
  window.addEventListener('storage', onChange);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

export function useLocalValue<T>(
  key: string,
  parse: (raw: string | null) => T,
  serverValue: T,
): T {
  return useSyncExternalStore(
    subscribe,
    () => {
      let raw: string | null = null;
      try {
        raw = localStorage.getItem(key);
      } catch {
        return serverValue;
      }
      const hit = cache.get(key);
      if (hit && hit.raw === raw) return hit.value as T;
      const value = parse(raw);
      cache.set(key, { raw, value });
      return value;
    },
    () => serverValue,
  );
}

/** Signals this tab's readers that `key` changed under them. */
export function notifyLocalChange(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
