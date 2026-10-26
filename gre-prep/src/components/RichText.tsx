import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

/* Renders the content Markdown subset with KaTeX maths.
 * `inline` strips the paragraph wrapper so it can sit inside a button or a sentence. */

const inlineComponents = { p: ({ children }: { children?: React.ReactNode }) => <>{children}</> };

export function RichText({ children, inline = false, className }: { children: string; inline?: boolean; className?: string }) {
  const md = (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={inline ? inlineComponents : undefined}
      allowedElements={undefined}
      skipHtml
    >
      {children}
    </ReactMarkdown>
  );
  if (inline) return <span className={className}>{md}</span>;
  return <div className={['prose-sar', className].filter(Boolean).join(' ')}>{md}</div>;
}
