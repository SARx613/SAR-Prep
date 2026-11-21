import { describe, expect, it } from 'vitest';
import { ERRATA, pendingErrata, remapAnswers } from '@/lib/official-errata';

describe('official errata', () => {
  const e = ERRATA.find((x) => x.id === 'test-1-s6-q3-quantities-swapped')!;
  const before = Date.parse(e.fixedAt) - 60_000;
  const after = Date.parse(e.fixedAt) + 60_000;

  it('applies only to runs of that test started before the fix, once', () => {
    expect(pendingErrata('test-1', before).map((x) => x.id)).toContain(e.id);
    expect(pendingErrata('test-1', after)).toEqual([]);
    expect(pendingErrata('test-2', before)).toEqual([]);
    expect(pendingErrata('test-1', before, [e.id])).toEqual([]);
  });

  it('translates an answer given on the swapped question into the corrected one', () => {
    const answers = { s6: { 3: { ids: ['B'] }, 4: { ids: ['B'] } }, s5: { 3: { ids: ['B'] } } };
    const out = remapAnswers(answers, [e]);
    expect(out.s6[3].ids).toEqual(['A']);
    expect(out.s6[4].ids).toEqual(['B']);
    expect(out.s5[3].ids).toEqual(['B']);
    expect(remapAnswers({ s6: { 3: { ids: ['C'] } } }, [e]).s6[3].ids).toEqual(['C']);
    expect(remapAnswers({}, [e])).toEqual({});
  });
});
