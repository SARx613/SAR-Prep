/* Study plan (PLAN §6.3): spread the work that is left over the weeks until
 * the test. Weak chapters (from the diagnostic or recent accuracy) come first.
 * Pure, so it is tested without a browser. */

export interface PlanLesson { id: string; chapter: string; title: string; minutes: number; remainingMinutes: number }
export interface PlanItem { kind: 'lesson' | 'mock'; id: string; title: string; minutes: number }
export interface PlanWeek { index: number; start: Date; items: PlanItem[]; minutes: number }

const DAY = 86_400_000;

export function buildPlan(opts: {
  lessons: PlanLesson[];
  weakChapters: string[];
  examDate: Date;
  hoursPerWeek: number;
  now: Date;
  mocksDone: number;
  mockCount: number;
}): PlanWeek[] {
  const { lessons, weakChapters, examDate, hoursPerWeek, now, mocksDone, mockCount } = opts;
  const weeksLeft = Math.max(1, Math.ceil((examDate.getTime() - now.getTime()) / (7 * DAY)));
  const budget = Math.max(1, hoursPerWeek) * 60;

  // Weak chapters first, otherwise syllabus order. Finished lessons drop out.
  const todo = lessons
    .filter((l) => l.remainingMinutes > 0)
    .map((l, i) => ({ l, i, weak: weakChapters.indexOf(l.chapter) }))
    .sort((a, b) => (a.weak < 0 ? 99 : a.weak) - (b.weak < 0 ? 99 : b.weak) || a.i - b.i)
    .map((x) => x.l);

  // Mocks: one every other week, the last in the final week before the test.
  const mockWeeks = new Set<number>();
  const remainingMocks = Math.max(0, mockCount - mocksDone);
  for (let k = 0; k < remainingMocks; k++) {
    const w = weeksLeft - 1 - k * 2;
    if (w >= 1) mockWeeks.add(w);
  }
  if (remainingMocks > 0 && mockWeeks.size === 0) mockWeeks.add(weeksLeft - 1);

  const weeks: PlanWeek[] = [];
  let cursor = 0;
  let nextMock = mocksDone + 1;
  for (let w = 0; w < weeksLeft; w++) {
    const items: PlanItem[] = [];
    let used = 0;
    if (mockWeeks.has(w) && nextMock <= mockCount) {
      items.push({ kind: 'mock', id: `m${nextMock}`, title: `Mock test ${nextMock}`, minutes: 130 });
      used += 130; nextMock++;
    }
    while (cursor < todo.length && used < budget) {
      const l = todo[cursor++];
      items.push({ kind: 'lesson', id: l.id, title: l.title, minutes: l.remainingMinutes });
      used += l.remainingMinutes;
    }
    weeks.push({ index: w + 1, start: new Date(now.getTime() + w * 7 * DAY), items, minutes: used });
  }
  // Anything that did not fit goes in the last week rather than being silently dropped.
  if (cursor < todo.length) {
    const last = weeks[weeks.length - 1];
    for (; cursor < todo.length; cursor++) {
      const l = todo[cursor];
      last.items.push({ kind: 'lesson', id: l.id, title: l.title, minutes: l.remainingMinutes });
      last.minutes += l.remainingMinutes;
    }
  }
  return weeks;
}
