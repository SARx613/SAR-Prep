import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { answeredBefore, type Attempt } from '@/lib/attempts';
import { SESSION_TTL, clearSession, loadSession, pruneSessions, saveSession } from '@/lib/session';

class MemoryStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
  removeItem(k: string) { this.m.delete(k); }
}

const at = (qid: string, correct: boolean, mode: Attempt['mode'] = 'tutor'): Attempt => ({ qid, lessonId: 'l1', type: 'PS', difficulty: 2, correct, ms: 1000, ts: 1, mode });

describe('answeredBefore', () => {
  it('lists the questions answered, with the latest outcome', () => {
    const m = answeredBefore([at('a', false), at('b', true), at('a', true)], ['a', 'b', 'c']);
    expect([...m.entries()]).toEqual([['a', true], ['b', true]]);
  });
  it('ignores other questions and lesson checks', () => {
    const m = answeredBefore([at('x', true), at('a', true, 'check')], ['a', 'b']);
    expect(m.size).toBe(0);
  });
});

describe('practice session storage', () => {
  beforeEach(() => { (globalThis as { localStorage?: unknown }).localStorage = new MemoryStorage(); });
  afterEach(() => { delete (globalThis as { localStorage?: unknown }).localStorage; });

  it('keeps the screen state between loads', () => {
    saveSession('exam:l1:u:0', { idx: 10, note: 'x' });
    expect(loadSession('exam:l1:u:0', SESSION_TTL.tutor)).toEqual({ idx: 10, note: 'x' });
  });
  it('forgets a session that is too old', () => {
    saveSession('k', { idx: 3 });
    expect(loadSession('k', -1)).toBeNull();
    expect(loadSession('k', SESSION_TTL.tutor)).toBeNull();
  });
  it('clears and prunes', () => {
    saveSession('a', 1); saveSession('b', 2);
    clearSession('a');
    expect(loadSession('a', SESSION_TTL.tutor)).toBeNull();
    pruneSessions(-1);
    expect(loadSession('b', SESSION_TTL.tutor)).toBeNull();
  });
  it('survives corrupt data', () => {
    localStorage.setItem('sar-session:bad', '{oops');
    expect(loadSession('bad', SESSION_TTL.tutor)).toBeNull();
  });
});
