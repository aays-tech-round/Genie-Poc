import { useEffect, useMemo, useRef, useState } from 'react';
import { toNumber, timeValue, fmtFull, fmtCompact, formatValue, formatLabel, niceTicks } from './resultUtils';

const axisText = 'fill-secondary text-[11px] tabular-nums';
const dot = 'fill-accent stroke-main stroke-2';

// Time series with a hover crosshair; resizes with its container.
export default function LineChart({ rows, label, metric }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(260, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points = useMemo(
    () => rows
      .map((r) => ({ label: formatLabel(r[label]), t: timeValue(r[label]), v: toNumber(r[metric]) }))
      .filter((p) => p.v !== null)
      .sort((a, b) => a.t - b.t),
    [rows, label, metric]
  );

  if (points.length < 2) return <div className="mt-[0.6rem] text-[0.78rem] text-secondary">Not enough data to chart.</div>;

  const height = 240;
  const pad = { top: 16, right: 56, bottom: 28, left: 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const ticks = niceTicks(Math.min(...points.map((p) => p.v)), Math.max(...points.map((p) => p.v)));
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const x = (i) => pad.left + (i / (points.length - 1)) * innerW;
  const y = (v) => pad.top + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${y(yMin)} L${x(0).toFixed(1)},${y(yMin)} Z`;
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerW / 90))));
  const last = points[points.length - 1];

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const i = Math.round(((px - pad.left) / innerW) * (points.length - 1));
    setHover(Math.min(points.length - 1, Math.max(0, i)));
  };

  const hp = hover !== null ? points[hover] : null;

  return (
    <div className="relative w-full" ref={wrapRef}>
      <svg
        width={width}
        height={height}
        className="block max-w-full touch-pan-y overflow-visible"
        role="img"
        aria-label={`Line chart of ${metric} over ${label}`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} className="stroke-line stroke-1" />
            <text x={pad.left - 8} y={y(t)} className={axisText} textAnchor="end" dominantBaseline="middle">
              {fmtCompact.format(t)}
            </text>
          </g>
        ))}
        {points.map((p, i) => (i % labelEvery === 0 || i === points.length - 1) && (
          <text key={i} x={x(i)} y={height - 8} className={axisText} textAnchor="middle">{p.label}</text>
        ))}
        <path d={area} className="fill-accent opacity-10" />
        <path d={line} className="fill-none stroke-accent stroke-2 [stroke-linecap:round] [stroke-linejoin:round]" />
        <circle cx={x(points.length - 1)} cy={y(last.v)} r="4" className={dot} />
        <text x={x(points.length - 1) + 8} y={y(last.v)} className="fill-primary text-[12px] font-medium tabular-nums" dominantBaseline="middle">
          {formatValue(last.v)}
        </text>
        {hp && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} className="stroke-secondary stroke-1" />
            <circle cx={x(hover)} cy={y(hp.v)} r="5" className={dot} />
          </g>
        )}
      </svg>
      {hp && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full animate-[fadeOnly_0.12s_ease_both] rounded-[10px] border border-line bg-main px-[0.6rem] py-[0.4rem] whitespace-nowrap shadow-lg"
          style={{
            left: Math.min(Math.max(x(hover), 70), width - 70),
            top: Math.max(y(hp.v) - 12, 0),
          }}
        >
          <div className="text-[0.72rem] text-secondary">{hp.label}</div>
          <div className="text-[0.85rem] font-semibold text-primary tabular-nums">{fmtFull.format(hp.v)}</div>
        </div>
      )}
    </div>
  );
}
