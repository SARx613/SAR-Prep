'use client';

import type {
  Figure,
  PieFigureData,
  SeriesFigureData,
  TableFigureData,
} from '@/types/questions';

/* Renders a data-interpretation figure as inline SVG.
 *
 * Drawn by hand rather than with a chart library: the figures are simple,
 * and a DI question depends on the reader being able to read values off the
 * chart precisely, so every bar carries its printed value. */

const PALETTE = ['#8b5cf6', '#10b981', '#f59e0b', '#38bdf8', '#f43f5e'];

export function FigureView({ figure }: { figure: Figure }) {
  return (
    <figure className="rounded-xl bg-white/[0.02] border border-white/8 p-4 overflow-x-auto">
      {figure.title && (
        <figcaption className="text-xs uppercase tracking-wide text-[var(--text-muted)] mb-3">
          {figure.title}
        </figcaption>
      )}
      {figure.kind === 'table' ? (
        <TableFigure data={figure.data as TableFigureData} />
      ) : figure.kind === 'pie' ? (
        <PieFigure data={figure.data as PieFigureData} />
      ) : (
        <BarFigure data={figure.data as SeriesFigureData} />
      )}
      {figure.notes && (
        <p className="text-xs text-[var(--text-muted)] mt-3">{figure.notes}</p>
      )}
    </figure>
  );
}

function BarFigure({ data }: { data: SeriesFigureData }) {
  const all = data.series.flatMap((s) => s.values);
  const max = Math.max(...all, 1);
  const W = 520;
  const H = 240;
  const padL = 44;
  const padB = 34;
  const padT = 12;
  const plotW = W - padL - 12;
  const plotH = H - padB - padT;

  const groups = data.categories.length;
  const groupW = plotW / groups;
  const barW = Math.min(38, (groupW * 0.7) / data.series.length);

  // Four gridlines, on round numbers.
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full min-w-[420px] h-auto"
      role="img"
      aria-label={`Bar chart. ${data.series
        .map((s) => `${s.name}: ${s.values.join(', ')}`)
        .join('. ')}`}
    >
      {ticks.map((t) => {
        const y = padT + plotH - (t / max) * plotH;
        return (
          <g key={t}>
            <line x1={padL} x2={W - 12} y1={y} y2={y} stroke="rgba(255,255,255,0.07)" />
            <text x={padL - 8} y={y + 4} textAnchor="end" fill="#4a5468" fontSize="11">
              {t}
            </text>
          </g>
        );
      })}

      {data.categories.map((cat, ci) => (
        <g key={cat}>
          {data.series.map((s, si) => {
            const v = s.values[ci];
            const h = (v / max) * plotH;
            const x =
              padL + ci * groupW + groupW / 2 - (data.series.length * barW) / 2 + si * barW;
            const y = padT + plotH - h;
            return (
              <g key={s.name}>
                <rect
                  x={x}
                  y={y}
                  width={barW - 4}
                  height={Math.max(h, 1)}
                  rx="3"
                  fill={PALETTE[si % PALETTE.length]}
                  opacity="0.85"
                />
                <text
                  x={x + (barW - 4) / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fill="#8892a4"
                  fontSize="11"
                >
                  {v}
                </text>
              </g>
            );
          })}
          <text
            x={padL + ci * groupW + groupW / 2}
            y={H - padB + 18}
            textAnchor="middle"
            fill="#8892a4"
            fontSize="11"
          >
            {cat}
          </text>
        </g>
      ))}

      {data.yLabel && (
        <text
          x={12}
          y={padT + plotH / 2}
          fill="#4a5468"
          fontSize="11"
          transform={`rotate(-90 12 ${padT + plotH / 2})`}
          textAnchor="middle"
        >
          {data.yLabel}
        </text>
      )}

      {data.series.length > 1 && (
        <g>
          {data.series.map((s, si) => (
            <g key={s.name} transform={`translate(${padL + si * 140}, ${H - 6})`}>
              <rect width="10" height="10" rx="2" y="-9" fill={PALETTE[si % PALETTE.length]} />
              <text x="15" fill="#8892a4" fontSize="11">
                {s.name}
              </text>
            </g>
          ))}
        </g>
      )}
    </svg>
  );
}

function PieFigure({ data }: { data: PieFigureData }) {
  const total = data.slices.reduce((a, s) => a + s.value, 0) || 1;
  const R = 80;
  const C = 100;

  // Each slice starts where the preceding slices end, so its offset is the
  // running total of everything before it — computed without mutation so
  // the render stays pure.
  const arcs = data.slices.map((slice, i) => {
    const before = data.slices
      .slice(0, i)
      .reduce((sum, s) => sum + s.value, 0);
    const start = -Math.PI / 2 + (before / total) * Math.PI * 2;
    const sweep = (slice.value / total) * Math.PI * 2;
    return { slice, start, end: start + sweep, sweep };
  });

  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 200 200" className="w-[200px] h-[200px]" role="img">
        {arcs.map(({ slice, start, end, sweep }, i) => {
          const x1 = C + R * Math.cos(start);
          const y1 = C + R * Math.sin(start);
          const x2 = C + R * Math.cos(end);
          const y2 = C + R * Math.sin(end);
          const large = sweep > Math.PI ? 1 : 0;
          return (
            <path
              key={slice.label}
              d={`M ${C} ${C} L ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2} Z`}
              fill={PALETTE[i % PALETTE.length]}
              opacity="0.85"
              stroke="#0f1420"
              strokeWidth="1.5"
            />
          );
        })}
      </svg>
      <ul className="text-sm space-y-1.5">
        {data.slices.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-sm inline-block"
              style={{ background: PALETTE[i % PALETTE.length] }}
            />
            <span className="text-[var(--text-primary)]">{s.label}</span>
            <span className="text-[var(--text-muted)]">
              {Math.round((s.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TableFigure({ data }: { data: TableFigureData }) {
  return (
    <table className="w-full text-sm border-collapse">
      <thead>
        <tr>
          {data.columns.map((c) => (
            <th
              key={c}
              className="text-left px-3 py-2 border-b border-white/10 text-[var(--text-muted)] font-medium text-xs uppercase tracking-wide"
            >
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.rows.map((row, i) => (
          <tr key={i} className="border-b border-white/5 last:border-0">
            {row.map((cell, j) => (
              <td key={j} className="px-3 py-2 text-[var(--text-primary)]">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
