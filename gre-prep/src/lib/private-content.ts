import fs from 'node:fs';
import path from 'node:path';

/* Private study material (ETS's own tests and exercises) lives in gre-prep/private/,
 * which is git-ignored and never part of a deployment. This reads it at request
 * time; when the folder is absent — every public build — the readers return null
 * and the features that depend on it report "not found". */

const ROOT = path.join(process.cwd(), 'private');
const cache = new Map<string, unknown>();

export function readPrivateJson<T>(rel: string): T | null {
  if (cache.has(rel)) return cache.get(rel) as T | null;
  let value: T | null = null;
  try {
    value = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8')) as T;
  } catch {
    value = null;
  }
  cache.set(rel, value);
  return value;
}
