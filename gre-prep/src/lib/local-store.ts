'use client';

import { notifyLocalChange, useLocalValue } from '@/hooks/useLocalValue';

/* Thin helpers over the app's localStorage store (hooks/useLocalValue), for
 * the official tests and the Math Review deck. */

const asIs = (raw: string | null) => raw;

/** The raw string stored under `key`; null on the server and when absent. */
export function useLocalString(key: string): string | null {
  return useLocalValue<string | null>(key, asIs, null);
}

export function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* blocked storage: the change lasts for the visit only */
  }
  notifyLocalChange();
}
