'use client';

import type { FigureSpec } from '@/content/schema';

/* Figures for DI sets and geometry (PLAN §3.3, ETS conventions).
 *
 * Hand-drawn SVG rather than a chart library: a DI question depends on the
 * reader taking values off the chart, so every bar and point carries its
 * number, and axes always start at zero (ETS warns about broken scales; ours
 * never break). Geometry uses authored SVG, which the content checker has
 * already screened for scripts and external references. */

const COLORS = ['var(--c1)', 'var(--c2)', 'var(--c3)', 'var(--c4)', 'var(--c5)'];

const nice = (max: number) => {
  const pow = Math.pow(10, Math.floor(Math.log10(Math.max(max, 1))));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * pow >= max) return m * pow;
  return 10 * pow;
};
const fmt = (n: number) => (Number.isInteger(n) ? String(n) : String(+n.toFixed(2)));

type SeriesData = Extract<FigureSpec, { kind: 'bar' | 'line' }>['data'];

function Legend({ names }: { names: string[] }) {
  if (names.length < 2) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      {names.map((n, i) => (
        <li key={n} className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: COLORS[i % 5] }} />
          {n}
        </li>
      ))}
    </ul>
  );
}

interface Pad { l: number; r: number; t: number; b: number }

function Axes({ W, H, pad, max, yLabel, xLabel }: { W: number; H: number; pad: Pad; max: number; yLabel?: string; xLabel?: string }) {
  const top = nice(max);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => top * f);
  const plotH = H - pad.t - pad.b;
  return (
    <g fontSize="11" fill="currentColor">
      {ticks.map((t) => {
        const y = pad.t + plotH - (t / top) * plotH;
        return (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y} y2={y} stroke="currentColor" strokeOpacity={0.15} />
            <text x={pad.l - 6} y={y + 4} textAnchor="end">{fmt(t)}</text>
          </g>
        );
      })}
      {yLabel && (
        <text transform={`rotate(-90 12 ${pad.t + plotH / 2})`} x={12} y={pad.t + plotH / 2} textAnchor="middle">{yLabel}</text>
      )}
      {xLabel && <text x={(pad.l + W - pad.r) / 2} y={H - 4} textAnchor="middle">{xLabel}</text>}
    </g>
  );
}

function Bar({ data }: { data: SeriesData }) {
  const W = 560, H = 270;
  const pad: Pad = { l: 52, r: 12, t: 14, b: data.xLabel ? 56 : 44 };
  const all = data.series.flatMap((s) => s.values);
  const top = nice(Math.max(...all, 1));
  const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
  const gw = plotW / data.categories.length;
  const bw = Math.min(44, (gw * 0.72) / data.series.length);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Bar graph" className="h-auto w-full text-fg">
      <Axes W={W} H={H} pad={pad} max={Math.max(...all, 1)} yLabel={data.yLabel} xLabel={data.xLabel} />
      {data.categories.map((c, ci) => (
        <g key={c}>
          {data.series.map((s, si) => {
            const v = s.values[ci] ?? 0;
            const h = (v / top) * plotH;
            const x = pad.l + gw * ci + (gw - bw * data.series.length) / 2 + bw * si;
            return (
              <g key={s.name}>
                <rect x={x} y={pad.t + plotH - h} width={bw - 2} height={h} fill={COLORS[si % 5]} rx={1.5} />
                <text x={x + (bw - 2) / 2} y={pad.t + plotH - h - 4} textAnchor="middle" fontSize="10.5" fill="currentColor">{fmt(v)}</text>
              </g>
            );
          })}
          <text x={pad.l + gw * ci + gw / 2} y={H - pad.b + 16} textAnchor="middle" fontSize="11" fill="currentColor">{c}</text>
        </g>
      ))}
      <line x1={pad.l} x2={W - pad.r} y1={pad.t + plotH} y2={pad.t + plotH} stroke="currentColor" />
    </svg>
  );
}

function LineChart({ data }: { data: SeriesData }) {
  const W = 560, H = 270;
  const pad: Pad = { l: 52, r: 16, t: 14, b: data.xLabel ? 56 : 44 };
  const all = data.series.flatMap((s) => s.values);
  const top = nice(Math.max(...all, 1));
  const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
  const n = data.categories.length;
  const x = (i: number) => pad.l + (n === 1 ? plotW / 2 : (plotW * i) / (n - 1));
  const y = (v: number) => pad.t + plotH - (v / top) * plotH;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Line graph" className="h-auto w-full text-fg">
      <Axes W={W} H={H} pad={pad} max={Math.max(...all, 1)} yLabel={data.yLabel} xLabel={data.xLabel} />
      {data.series.map((s, si) => (
        <g key={s.name} stroke={COLORS[si % 5]} fill={COLORS[si % 5]}>
          <polyline fill="none" strokeWidth={2.2} points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(' ')} />
          {s.values.map((v, i) => (
            <g key={i}>
              <circle cx={x(i)} cy={y(v)} r={3.4} />
              <text x={x(i)} y={y(v) - 8} textAnchor="middle" fontSize="10.5" stroke="none" fill="currentColor">{fmt(v)}</text>
            </g>
          ))}
        </g>
      ))}
      {data.categories.map((c, i) => (
        <text key={c} x={x(i)} y={H - pad.b + 16} textAnchor="middle" fontSize="11" fill="currentColor">{c}</text>
      ))}
      <line x1={pad.l} x2={W - pad.r} y1={pad.t + plotH} y2={pad.t + plotH} stroke="currentColor" />
    </svg>
  );
}

function Pie({ data }: { data: Extract<FigureSpec, { kind: 'pie' }>['data'] }) {
  const total = data.slices.reduce((a, s) => a + s.value, 0);
  const R = 90, cx = 130, cy = 110;
  // Start angle of each slice, computed up front so the render stays pure.
  const starts = data.slices.reduce<number[]>((acc, s, i) => [...acc, i === 0 ? -Math.PI / 2 : acc[i - 1] + (data.slices[i - 1].value / total) * Math.PI * 2], []);
  return (
    <div className="flex flex-wrap items-center gap-4">
      <svg viewBox="0 0 260 220" role="img" aria-label="Circle graph" className="h-auto w-full max-w-[280px] text-fg">
        {data.slices.map((s, i) => {
          const frac = s.value / total;
          const a0 = starts[i];
          const a1 = a0 + frac * Math.PI * 2;
          const large = frac > 0.5 ? 1 : 0;
          const p = (a: number, r: number) => `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`;
          const mid = (a0 + a1) / 2;
          const d = `M${cx},${cy} L${p(a0, R)} A${R},${R} 0 ${large} 1 ${p(a1, R)} Z`;
          const [lx, ly] = p(mid, R * 0.62).split(',');
          return (
            <g key={s.label}>
              <path d={d} fill={COLORS[i % 5]} stroke="var(--surface)" strokeWidth={2} />
              {frac > 0.04 && (
                <text x={lx} y={ly} textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" stroke="rgba(0,0,0,0.35)" strokeWidth={0.4}>
                  {fmt(s.value)}{data.unit === '%' ? '%' : ''}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <ul className="space-y-1 text-sm">
        {data.slices.map((s, i) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm" style={{ background: COLORS[i % 5] }} />
            {s.label}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Scatter({ data }: { data: Extract<FigureSpec, { kind: 'scatter' }>['data'] }) {
  const W = 520, H = 280;
  const pad: Pad = { l: 52, r: 16, t: 14, b: 48 };
  const xs = data.points.map((p) => p[0]);
  const ys = data.points.map((p) => p[1]);
  const xTop = nice(Math.max(...xs, 1)), yTop = nice(Math.max(...ys, 1));
  const plotW = W - pad.l - pad.r, plotH = H - pad.t - pad.b;
  const X = (v: number) => pad.l + (v / xTop) * plotW;
  const Y = (v: number) => pad.t + plotH - (v / yTop) * plotH;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Scatterplot" className="h-auto w-full text-fg">
      <Axes W={W} H={H} pad={pad} max={Math.max(...ys, 1)} yLabel={data.yLabel} xLabel={data.xLabel} />
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <text key={f} x={X(xTop * f)} y={H - pad.b + 16} textAnchor="middle" fontSize="11" fill="currentColor">{fmt(xTop * f)}</text>
      ))}
      <line x1={pad.l} x2={W - pad.r} y1={pad.t + plotH} y2={pad.t + plotH} stroke="currentColor" />
      <line x1={pad.l} x2={pad.l} y1={pad.t} y2={pad.t + plotH} stroke="currentColor" />
      {data.points.map(([px, py], i) => (
        <circle key={i} cx={X(px)} cy={Y(py)} r={4} fill="var(--c1)" fillOpacity={0.85} />
      ))}
    </svg>
  );
}

function TableFigure({ data }: { data: Extract<FigureSpec, { kind: 'table' }>['data'] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {data.columns.map((c) => (
              <th key={c} scope="col" className="border border-line bg-surface-2 px-3 py-1.5 text-left font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r, i) => (
            <tr key={i}>
              {r.map((cell, j) => (
                <td key={j} className={`border border-line px-3 py-1.5 ${j === 0 ? 'font-medium' : 'tabular-nums'}`}>{String(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.unit && <p className="mt-1 text-xs text-faint">{data.unit}</p>}
    </div>
  );
}

export function Figure({ spec }: { spec: FigureSpec }) {
  return (
    <figure className="rounded-[var(--radius)] border border-line bg-surface p-3 sm:p-4">
      {spec.title && <figcaption className="mb-2 text-sm font-semibold text-fg">{spec.title}</figcaption>}
      {spec.kind === 'bar' && (<><Bar data={spec.data} /><Legend names={spec.data.series.map((s) => s.name)} /></>)}
      {spec.kind === 'line' && (<><LineChart data={spec.data} /><Legend names={spec.data.series.map((s) => s.name)} /></>)}
      {spec.kind === 'pie' && <Pie data={spec.data} />}
      {spec.kind === 'scatter' && <Scatter data={spec.data} />}
      {spec.kind === 'table' && <TableFigure data={spec.data} />}
      {spec.kind === 'svg' && (
        <div
          role="img"
          aria-label={spec.data.alt}
          className="mx-auto max-w-[420px] text-fg [&_svg]:h-auto [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: spec.data.svg }}
        />
      )}
      {spec.notes && <p className="mt-2 text-xs text-faint">{spec.notes}</p>}
    </figure>
  );
}
