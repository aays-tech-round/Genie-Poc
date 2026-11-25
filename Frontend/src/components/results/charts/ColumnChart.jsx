import { useEffect, useId, useRef, useState } from 'react';
import {
  MAX_BARS, SERIES_COUNT, toNumber, fmtFull, fmtCompact, formatLabel, prettyName, niceTicks, seriesColor,
} from '../resultUtils';
import useElementWidth from '@/hooks/useElementWidth';
import useRovingIndex from '@/hooks/useRovingIndex';
import ChartLegend from './ChartLegend';
import ChartTooltip from './ChartTooltip';
import { cn } from '@/lib/utils';
import './charts.css';


const MAX_SERIES = SERIES_COUNT; // one per palette slot; more would repeat colours
const HEIGHT = 300;
const PAD = { top: 12, right: 8, bottom: 40 };
const GAP = 2; // surface gap between neighbouring columns in a group
const MAX_COLUMN = 44; // widest a single column gets
const MIN_BAND = 32; // narrowest a category gets before the chart scrolls sideways
const LABEL_MIN = 64; // x-axis labels closer together than this skip some categories
// A metric whose largest value is under 2% of the largest metric's would be a flat line on
// the shared axis, so it starts hidden; the legend can still turn it on.
const SCALE_RATIO = 0.02;

const axisText = 'fill-secondary text-[11px] tabular-nums';

function columnPath(x, w, yZero, yEnd) {
  const h = Math.abs(yZero - yEnd);
  if (h < 0.5) return '';
  const r = Math.min(4, w / 2, h);
  const s = yEnd < yZero ? 1 : -1; // 1 = grows up (positive), -1 = grows down (negative)
  return (
    `M${x},${yZero}V${yEnd + s * r}` +
    `Q${x},${yEnd} ${x + r},${yEnd}H${x + w - r}` +
    `Q${x + w},${yEnd} ${x + w},${yEnd + s * r}V${yZero}Z`
  );
}

const truncate = (text, maxChars) =>
  text.length <= maxChars ? text : `${text.slice(0, Math.max(1, maxChars - 1))}…`;

export default function ColumnChart({ rows, label, metrics }) {
  const liveId = useId();
  const scrollRef = useRef(null);
  const width = useElementWidth(scrollRef, 640);
  const [highlight, setHighlight] = useState(null); // series key hovered in the legend

  // Colour belongs to the metric (its slot), so hiding one never repaints the others.
  const series = metrics.slice(0, MAX_SERIES).map((key, slot) => ({
    key,
    slot,
    name: prettyName(key),
    color: seriesColor(slot),
    peak: Math.max(0, ...rows.map((r) => Math.abs(toNumber(r[key]) ?? 0))),
  }));
  const categories = rows.slice(0, MAX_BARS).map((r) => ({
    name: formatLabel(r[label]),
    values: series.map((s) => toNumber(r[s.key])),
  }));
  const n = categories.length;

  const [hidden, setHidden] = useState(() => {
    const top = Math.max(0, ...series.map((s) => s.peak));
    return new Set(series.filter((s) => s.peak < top * SCALE_RATIO).map((s) => s.key));
  });
  const [active, setActive, onKeyDown] = useRovingIndex(n, { next: 'ArrowRight', prev: 'ArrowLeft' });

  const visible = series.filter((s) => !hidden.has(s.key));
  const toggleSeries = (key) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (series.length - next.size > 1) next.add(key); // always keep one metric on
      return next;
    });

  // ---- Geometry ---------------------------------------------------------------------------
  const k = Math.max(1, visible.length);
  const shownValues = categories.flatMap((c) => visible.map((s) => c.values[s.slot])).filter((v) => v !== null);
  const ticks = shownValues.length ? niceTicks(Math.min(0, ...shownValues), Math.max(0, ...shownValues)) : [0, 1];
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const padLeft = Math.max(36, Math.max(...ticks.map((t) => fmtCompact.format(t).length)) * 7 + 14);

  const minBand = Math.max(MIN_BAND, k * 12 + GAP * (k - 1) + 12);
  const contentW = Math.max(width, padLeft + PAD.right + n * minBand);
  const innerW = contentW - padLeft - PAD.right;
  const innerH = HEIGHT - PAD.top - PAD.bottom;
  const band = innerW / n;
  const colW = Math.min(MAX_COLUMN, (band * 0.72 - GAP * (k - 1)) / k);
  const groupW = k * colW + GAP * (k - 1);
  const groupX = (i) => padLeft + i * band + (band - groupW) / 2;
  const y = (v) => PAD.top + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;
  const yZero = y(Math.max(yMin, Math.min(0, yMax)));

  const labelEvery = Math.max(1, Math.ceil(LABEL_MIN / band));
  const labelChars = Math.max(3, Math.floor((band * labelEvery - 8) / 6.5));

  // ---- Interaction ------------------------------------------------------------------------
  const indexAt = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const i = Math.floor((e.clientX - rect.left - padLeft) / band);
    return i >= 0 && i < n ? i : null;
  };

  // Keeps the picked category inside the scrolled view (matters for keyboard picks; a pointer
  // pick is already on screen, so this does nothing then).
  useEffect(() => {
    const el = scrollRef.current;
    if (active === null || !el) return;
    const cx = padLeft + (active + 0.5) * band;
    if (cx < el.scrollLeft + padLeft || cx > el.scrollLeft + el.clientWidth - 24) {
      el.scrollLeft = cx - el.clientWidth / 2;
    }
  }, [active, padLeft, band]);

  const cat = active !== null && active < n ? categories[active] : null;
  // The tooltip sits beside the picked group, on whichever side has more room.
  const tipStyle = cat && ((active + 0.5) * band > innerW / 2
    ? { right: contentW - groupX(active) + 10, top: PAD.top }
    : { left: groupX(active) + groupW + 10, top: PAD.top });
  const tipItems = cat ? visible.map((s) => ({ ...s, value: cat.values[s.slot] })) : [];
  const liveText = cat
    ? `${cat.name}: ${tipItems.map((t) => `${t.name} ${t.value === null ? 'no value' : fmtFull.format(t.value)}`).join(', ')}`
    : '';

  return (
    <div className="viz">
      <div className="mb-3">
        <ChartLegend series={series} hidden={hidden} onToggle={toggleSeries} onHighlight={setHighlight} />
      </div>

      <div
        ref={scrollRef}
        className="relative overflow-x-auto overflow-y-hidden rounded-lg outline-none scrollbar-thin focus-visible:ring-2 focus-visible:ring-accent-soft"
        tabIndex={0}
        role="group"
        aria-label={`Column chart of ${visible.map((s) => s.name).join(', ')} by ${prettyName(label)}. Use the left and right arrow keys to read each ${prettyName(label)}.`}
        aria-describedby={liveId}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
      >
        <div className="relative" style={{ width: contentW }}>
          <svg
            width={contentW}
            height={HEIGHT}
            className="block touch-pan-x overflow-visible"
            aria-hidden="true"
            onPointerMove={(e) => setActive(indexAt(e))}
            onPointerDown={(e) => setActive(indexAt(e))}
            onPointerLeave={(e) => e.pointerType === 'mouse' && setActive(null)}
          >
            {/* Grid and y-axis */}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={padLeft} x2={contentW - PAD.right} y1={y(t)} y2={y(t)} className="stroke-line stroke-1" />
                <text x={padLeft - 8} y={y(t)} className={axisText} textAnchor="end" dominantBaseline="middle">
                  {fmtCompact.format(t)}
                </text>
              </g>
            ))}

            {/* Band behind the picked category */}
            {cat && (
              <rect x={padLeft + active * band} y={PAD.top} width={band} height={innerH} rx="6" className="fill-secondary opacity-[0.08]" />
            )}

            {/* Columns */}
            {categories.map((c, i) =>
              visible.map((s, j) => {
                const v = c.values[s.slot];
                if (v === null) return null;
                const dim = (highlight && highlight !== s.key) || (cat && active !== i);
                return (
                  <path
                    key={`${i}-${s.key}`}
                    d={columnPath(groupX(i) + j * (colW + GAP), colW, yZero, y(v))}
                    fill={s.color}
                    className={cn('viz-col', v < 0 && 'viz-neg', active === i && 'brightness-110')}
                    style={{ opacity: dim ? 0.35 : 1, animationDelay: `${Math.min(i * 20, 300)}ms` }}
                  />
                );
              })
            )}

            {/* Zero line, drawn over the columns' square ends */}
            <line x1={padLeft} x2={contentW - PAD.right} y1={yZero} y2={yZero} className="stroke-secondary stroke-1 opacity-60" />

            {/* X-axis labels */}
            {categories.map((c, i) => (i % labelEvery === 0 || i === active) && (
              <text
                key={i}
                x={padLeft + (i + 0.5) * band}
                y={HEIGHT - PAD.bottom + 18}
                className={cn(axisText, i === active && 'fill-primary font-medium')}
                textAnchor="middle"
              >
                {truncate(c.name, labelChars)}
              </text>
            ))}
          </svg>

          {cat && <ChartTooltip title={cat.name} items={tipItems} style={tipStyle} />}
        </div>
      </div>

      <p id={liveId} className="sr-only" aria-live="polite">{liveText}</p>

      {(rows.length > MAX_BARS || metrics.length > MAX_SERIES) && (
        <div className="mt-2 text-[0.78rem] text-secondary">
          {rows.length > MAX_BARS && `Showing the first ${MAX_BARS} of ${rows.length} rows. `}
          {metrics.length > MAX_SERIES && `Showing the first ${MAX_SERIES} of ${metrics.length} metrics. `}
          See the table for everything.
        </div>
      )}
    </div>
  );
}
