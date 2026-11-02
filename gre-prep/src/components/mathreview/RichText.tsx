'use client';

import type { ReactNode } from 'react';
import type { ExerciseImage } from '@/lib/mathreview';
import { FigureCard } from '@/components/official/ExamImage';
import { Markup } from '@/components/official/Markup';

/* Renders the typed text of an exercise (scripts/content/math_text.py):
 *
 *   one line per paragraph or sub-question, with $math$ inside
 *   [[figure]]            the exercise's figure goes here
 *   | a | b |             table rows; a |---| row after the first makes a header
 */

const isRow = (l: string) => l.trim().startsWith('|');

export function RichText({ text, figure }: { text: string; figure?: ExerciseImage }) {
  const lines = text.split('\n');
  const out: ReactNode[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '[[figure]]') {
      if (figure) out.push(<FigureCard key={i} img={figure} theme="paper" />);
      continue;
    }
    if (isRow(line)) {
      const rows: string[][] = [];
      while (i < lines.length && isRow(lines[i])) {
        rows.push(lines[i].trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()));
        i++;
      }
      i--;
      const header = rows.length > 1 && rows[1].every((c) => /^-+$/.test(c));
      const body = rows.filter((_, k) => !(header && k === 1));
      out.push(
        <div key={i} className="max-w-full overflow-x-auto">
          <table className="exam-table">
            {header && (
              <thead>
                <tr>
                  {body[0].map((c, j) => (
                    <th key={j}>
                      <Markup text={c} />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {body.slice(header ? 1 : 0).map((r, k) => (
                <tr key={k}>
                  {r.map((c, j) => (
                    <td key={j}>
                      <Markup text={c} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
      continue;
    }
    const sub = /^\([a-z]\)/.test(line);
    out.push(
      <p key={i} className={sub ? 'pl-3' : undefined}>
        <Markup text={line} />
      </p>,
    );
  }

  return <div className="space-y-2.5 text-[17px] leading-relaxed">{out}</div>;
}
