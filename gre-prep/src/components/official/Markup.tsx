import { Fragment, useMemo, type ReactNode } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/* Renders the light markup used in the typed content:
 *
 *   $x^2$          math (KaTeX)         \$           a literal dollar sign
 *   **bold**  *italic*  <u>underline</u>  <br>
 *   ⟦5⟧           margin line number of a passage
 *   {{1}}          a blank
 *
 * Bold matters (one question asks about "the two portions in boldface"), and
 * the line numbers let "line 9" in a question be found in the passage. */

const TOKEN = /(\\\$|\$[^$]+\$|<u>[^<]*<\/u>|<br>|\*\*[^*]+\*\*|\*[^*]+\*|⟦\d+⟧|\{\{\d\}\})/g;

function Tex({ src }: { src: string }) {
  const html = useMemo(
    () => katex.renderToString(src.includes('\\frac') ? '\\displaystyle ' + src : src, { throwOnError: false, output: 'html' }),
    [src],
  );
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

export function Markup({
  text,
  blanks,
}: {
  text: string;
  /** Replaces {{n}} (1-based); falls back to a rule when absent. */
  blanks?: (ReactNode | undefined)[];
}) {
  return (
    <>
      {text.split(TOKEN).map((part, i) => {
        if (!part) return null;
        if (part === '\\$') return <Fragment key={i}>$</Fragment>;
        if (part.startsWith('$')) return <Tex key={i} src={part.slice(1, -1)} />;
        if (part === '<br>') return <br key={i} />;
        if (part.startsWith('<u>')) return <u key={i}>{part.slice(3, -4)}</u>;
        if (part.startsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith('*')) return <em key={i}>{part.slice(1, -1)}</em>;
        if (part.startsWith('⟦')) {
          return (
            <sup key={i} className="mx-0.5 select-none text-[10px] font-semibold text-faint">
              {part.slice(1, -1)}
            </sup>
          );
        }
        const b = part.match(/^\{\{(\d)\}\}$/);
        if (b) return <Fragment key={i}>{blanks?.[Number(b[1]) - 1] ?? '\u2014\u2014\u2014'}</Fragment>;
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}
