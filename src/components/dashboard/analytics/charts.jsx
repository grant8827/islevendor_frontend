import { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Table2, BarChart3 } from 'lucide-react';

// Chart chrome + the one series hue. The dashboards are light-only, so these
// are plain constants rather than theme tokens. SERIES is the brand teal
// stepped down to 3.9:1 on white (the raw brand #11a8b5 is only 2.9:1).
const SERIES = '#0e8f9b';
const SURFACE = '#ffffff';
const GRID = '#e2e8f0';
const AXIS = '#cbd5e1';
const MUTED = '#64748b';
const GOOD = '#15803d';
const BAD = '#b91c1c';

// Round the axis up to clean numbers (0 / 1K / 2K …) rather than the raw max.
function niceScale(max, target = 4) {
  const rough = max / target;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough);
  const top = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = 0; v <= top + step / 1000; v += step) ticks.push(v);
  return { top, ticks };
}

function useWidth() {
  const ref = useRef(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.floor(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

// ─── Chart card ──────────────────────────────────────────────────────────
// Every chart gets a table twin, so no value is reachable only by hovering.
export function ChartCard({ title, subtitle, table, className = '', children }) {
  const [showTable, setShowTable] = useState(false);
  return (
    <figure className={`bg-white border border-slate-200 shadow-sm rounded-2xl p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-bold text-navy text-sm">{title}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {table && (
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            aria-pressed={showTable}
            className="shrink-0 flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-navy px-2 py-1 rounded-lg hover:bg-slate-100 transition"
          >
            {showTable ? <BarChart3 className="w-3.5 h-3.5" /> : <Table2 className="w-3.5 h-3.5" />}
            {showTable ? 'Chart' : 'Table'}
          </button>
        )}
      </div>
      {showTable && table ? (
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="text-slate-500 sticky top-0 bg-white">
              <tr>
                {table.columns.map((c, i) => (
                  <th key={c} className={`py-1.5 font-bold ${i > 0 ? 'text-right' : ''}`}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.rows.map((row) => (
                <tr key={row[0]}>
                  {row.map((cell, i) => (
                    <td key={i} className={`py-1.5 ${i > 0 ? 'text-right tabular-nums' : ''}`}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </figure>
  );
}

// ─── Stat tile ───────────────────────────────────────────────────────────
// `delta` is { pct, goodWhenUp } — colour is direction × whether up is good,
// and the arrow + sign carry the same meaning without the colour.
export function StatTile({ label, value, note, delta, className = '' }) {
  const up = delta && delta.pct >= 0;
  const good = delta && (up === (delta.goodWhenUp ?? true));
  return (
    <div className={`bg-white border border-slate-200 shadow-sm p-5 rounded-2xl ${className}`}>
      <span className="text-xs text-slate-500">{label}</span>
      <p className="text-2xl font-bold text-navy mt-1">{value}</p>
      <div className="mt-1 min-h-4 text-[11px] flex items-center gap-1 flex-wrap">
        {delta && (
          <span className="flex items-center gap-0.5 font-bold" style={{ color: good ? GOOD : BAD }}>
            {up ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
            {up ? '+' : '−'}
            {Math.abs(delta.pct).toFixed(0)}%
          </span>
        )}
        {note && <span className="text-slate-500">{note}</span>}
      </div>
    </div>
  );
}

// ─── Horizontal bar list ─────────────────────────────────────────────────
// items: [{ label, value, display, note }] — one series, one colour, value at
// the bar tip. The label sits above its bar so long product names never get
// clipped by the mark.
export function BarList({ items, empty = 'Nothing to show for this period.' }) {
  if (items.length === 0) return <p className="text-sm text-slate-500">{empty}</p>;
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label} title={`${item.label} — ${item.display}${item.note ? ` (${item.note})` : ''}`}>
          <div className="flex items-baseline justify-between gap-3 text-xs mb-1">
            <span className="text-slate-700 truncate">{item.label}</span>
            {item.note && <span className="text-slate-400 shrink-0">{item.note}</span>}
          </div>
          <div className="flex items-center gap-2">
            {/* Bars top out at 80% so the value at the tip always has room. */}
            <div
              className="h-2.5 rounded-r-[4px] hover:opacity-75 transition-opacity"
              style={{ width: `${Math.max((item.value / max) * 80, item.value > 0 ? 1 : 0)}%`, background: SERIES }}
            />
            <span className="text-xs font-bold text-slate-900 tabular-nums shrink-0">{item.display}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Trend chart (line + soft area, or columns) ──────────────────────────
// points: [{ label, tick, value }] in x order. Hovering (or arrow-keying)
// snaps a crosshair to the nearest point and shows a single readout.
const HEIGHT = 230;
const M = { top: 14, right: 20, bottom: 28, left: 52 };

export function TrendChart({ points, variant = 'line', formatValue, formatTick, valueLabel }) {
  const [wrapRef, width] = useWidth();
  const [hover, setHover] = useState(null);
  const n = points.length;
  const plotW = width - M.left - M.right;
  const plotH = HEIGHT - M.top - M.bottom;

  const { top, ticks } = niceScale(Math.max(...points.map((p) => p.value), 0) || 1);
  const y = (v) => M.top + plotH - (v / top) * plotH;
  const band = plotW / n;
  const x = (i) => (variant === 'columns' ? M.left + band * (i + 0.5) : n > 1 ? M.left + (i * plotW) / (n - 1) : M.left + plotW / 2);

  const nearest = (px) => {
    let best = 0;
    for (let i = 1; i < n; i += 1) if (Math.abs(x(i) - px) < Math.abs(x(best) - px)) best = i;
    return best;
  };

  function onPointerMove(e) {
    const rect = e.currentTarget.ownerSVGElement.getBoundingClientRect();
    setHover(nearest(e.clientX - rect.left));
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowRight') setHover((h) => Math.min((h ?? -1) + 1, n - 1));
    else if (e.key === 'ArrowLeft') setHover((h) => Math.max((h ?? n) - 1, 0));
    else if (e.key === 'Escape') setHover(null);
    else return;
    e.preventDefault();
  }

  const tickCount = Math.min(n, width < 480 ? 4 : 6);
  const xTicks = [...new Set(Array.from({ length: tickCount }, (_, k) => (tickCount === 1 ? 0 : Math.round((k * (n - 1)) / (tickCount - 1)))))];

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i)},${y(p.value)}`).join(' ');
  const areaPath = `${linePath} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`;
  const barW = Math.min(24, Math.max(band - 4, 2));

  // 4px rounded data-end, square at the baseline.
  const columnPath = (i) => {
    const h = y(0) - y(points[i].value);
    if (h <= 0) return '';
    const r = Math.min(4, h, barW / 2);
    const x0 = x(i) - barW / 2;
    const x1 = x0 + barW;
    const yTop = y(points[i].value);
    return `M${x0},${y(0)} V${yTop + r} Q${x0},${yTop} ${x0 + r},${yTop} H${x1 - r} Q${x1},${yTop} ${x1},${yTop + r} V${y(0)} Z`;
  };

  const hovered = hover != null ? points[hover] : null;
  const tipOnLeft = hover != null && x(hover) > width / 2;

  return (
    <div ref={wrapRef} className="relative">
      <svg
        width={width}
        height={HEIGHT}
        role="img"
        aria-label={`${valueLabel} over time. Use the table view for exact values.`}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onFocus={() => setHover((h) => h ?? n - 1)}
        onBlur={() => setHover(null)}
        onPointerLeave={() => setHover(null)}
        className="block outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 rounded"
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={M.left} x2={width - M.right} y1={y(t)} y2={y(t)} stroke={t === 0 ? AXIS : GRID} strokeWidth="1" />
            <text x={M.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize="10" fill={MUTED} className="tabular-nums">
              {formatTick(t)}
            </text>
          </g>
        ))}
        {xTicks.map((i) => (
          <text key={i} x={x(i)} y={HEIGHT - 8} textAnchor="middle" fontSize="10" fill={MUTED}>
            {points[i].tick}
          </text>
        ))}

        {variant === 'line' ? (
          <>
            <path d={areaPath} fill={SERIES} fillOpacity="0.1" />
            <path d={linePath} fill="none" stroke={SERIES} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            <circle cx={x(n - 1)} cy={y(points[n - 1].value)} r="4" fill={SERIES} stroke={SURFACE} strokeWidth="2" />
          </>
        ) : (
          points.map((p, i) => <path key={p.label} d={columnPath(i)} fill={SERIES} opacity={hover != null && hover !== i ? 0.45 : 1} />)
        )}

        {hovered && (
          <>
            {variant === 'line' && (
              <>
                <line x1={x(hover)} x2={x(hover)} y1={M.top} y2={y(0)} stroke={AXIS} strokeWidth="1" />
                <circle cx={x(hover)} cy={y(hovered.value)} r="4" fill={SERIES} stroke={SURFACE} strokeWidth="2" />
              </>
            )}
          </>
        )}

        {/* Hit area spans the whole plot, not just the painted marks. */}
        <rect x={M.left} y={M.top} width={plotW} height={plotH + 8} fill="transparent" onPointerMove={onPointerMove} onPointerDown={onPointerMove} />
      </svg>

      {hovered && (
        <div
          className="absolute pointer-events-none bg-white border border-slate-200 shadow-lg rounded-lg px-3 py-2 text-xs z-10"
          style={{ top: M.top, [tipOnLeft ? 'right' : 'left']: tipOnLeft ? width - x(hover) + 10 : x(hover) + 10 }}
        >
          <p className="text-slate-500">{hovered.label}</p>
          <p className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-block w-3 h-0.5 rounded" style={{ background: SERIES }} />
            <span className="font-bold text-slate-900 tabular-nums">{formatValue(hovered.value)}</span>
            <span className="text-slate-500">{valueLabel}</span>
          </p>
        </div>
      )}
    </div>
  );
}
