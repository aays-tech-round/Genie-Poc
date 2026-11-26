import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MAX_BARS, SERIES_COUNT, toNumber, fmtCompact, formatLabel, prettyName, seriesColor, canStack } from '../resultUtils';
import { animation, axisTick, barCursor, gridStroke, niceTicks, seriesKey, truncate } from './chartTheme';
import ChartLegend from './ChartLegend';
import ChartTooltip from './ChartTooltip';
import { cn } from '@/lib/utils';
import './charts.css';

// Grouped: metrics side by side. Stacked: metrics on top of each other, the column height
// being their total; offered only when that total is meaningful (see canStack).
const MODES = ['grouped', 'stacked'];


const HEIGHT = 300;
const MIN_GROUP = 36; // narrowest a category gets before the chart scrolls sideways
// The first metric Genie returned is the main one and is always shown. Another metric starts
// hidden when it is more than 50x larger or smaller than it: on the shared axis one of the two
// would be a flat line. The legend can turn it on.
const SCALE_RATIO = 50;

export default function ColumnChart({ rows, label, metrics }) {
  // Colour belongs to the metric (its slot), so hiding one never repaints the others.
  const series = metrics.slice(0, SERIES_COUNT).map((key, slot) => ({
    key,
    dataKey: seriesKey(slot),
    name: prettyName(key),
    color: seriesColor(slot),
    peak: Math.max(0, ...rows.map((r) => Math.abs(toNumber(r[key]) ?? 0))),
  }));
  const data = rows.slice(0, MAX_BARS).map((r) => ({
    name: formatLabel(r[label]),
    ...Object.fromEntries(series.map((s) => [s.dataKey, toNumber(r[s.key])])),
  }));

  const [hidden, setHidden] = useState(() => {
    const main = series[0].peak || 1;
    const offScale = (s) => s.peak > main * SCALE_RATIO || s.peak * SCALE_RATIO < main;
    return new Set(series.slice(1).filter(offScale).map((s) => s.key));
  });
  const toggleSeries = (key) =>
    setHidden((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else if (series.length - next.size > 1) next.add(key); // always keep one metric on
      return next;
    });

  const [mode, setMode] = useState('grouped');
  const visible = series.filter((s) => !hidden.has(s.key));
  const stackable = canStack(rows, visible.map((s) => s.key));
  const stacked = mode === 'stacked' && stackable; // hiding metrics can make stacking stop applying

  const values = stacked
    ? data.map((d) => visible.reduce((t, s) => t + (d[s.dataKey] ?? 0), 0))
    : data.flatMap((d) => visible.map((s) => d[s.dataKey])).filter((v) => v !== null);
  const ticks = niceTicks(Math.min(...values), Math.max(...values));
  const hasNegative = ticks[0] < 0;
  const minWidth = data.length * (stacked ? MIN_GROUP : Math.max(MIN_GROUP, visible.length * 14 + 12));

  return (
    <div className="viz">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <ChartLegend series={series} hidden={hidden} onToggle={toggleSeries} />
        {stackable && (
          <div className="inline-flex shrink-0 rounded-lg bg-soft p-0.5" role="radiogroup" aria-label="Column layout">
            {MODES.map((m) => (
              <button
                type="button"
                key={m}
                role="radio"
                aria-checked={mode === m}
                className={cn(
                  'rounded-md px-2.5 py-1 text-[0.75rem] font-medium capitalize transition-colors focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:outline-none',
                  mode === m ? 'bg-main text-primary shadow-sm ring-1 ring-line' : 'text-secondary hover:text-primary'
                )}
                onClick={() => setMode(m)}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scrolls sideways when there are too many categories to fit */}
      <div className="overflow-x-auto overflow-y-hidden scrollbar-thin">
        <div style={{ minWidth }}>
          <ResponsiveContainer width="100%" height={HEIGHT}>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke={gridStroke} />
              <XAxis
                dataKey="name"
                tick={axisTick}
                tickLine={false}
                axisLine={{ stroke: gridStroke }}
                tickFormatter={(v) => truncate(v, 14)}
                interval="preserveStartEnd"
                minTickGap={8}
              />
              <YAxis
                ticks={ticks}
                domain={[ticks[0], ticks[ticks.length - 1]]}
                tick={axisTick}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => fmtCompact.format(v)}
                width="auto"
              />
              {hasNegative && <ReferenceLine y={0} stroke="var(--secondary)" strokeOpacity={0.6} />}
              <Tooltip content={<ChartTooltip total={stacked} />} cursor={barCursor} />
              {visible.map((s, i) => (
                <Bar
                  key={s.key}
                  dataKey={s.dataKey}
                  name={s.name}
                  fill={s.color}
                  // Stacked: one rounded top on the whole column, and a thin card-coloured
                  // edge that separates the segments.
                  stackId={stacked ? 'total' : undefined}
                  radius={!stacked || i === visible.length - 1 ? [4, 4, 0, 0] : 0}
                  stroke={stacked ? 'var(--main)' : undefined}
                  strokeWidth={stacked ? 1 : 0}
                  maxBarSize={stacked ? 56 : 44}
                  {...animation}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {(rows.length > MAX_BARS || metrics.length > SERIES_COUNT) && (
        <div className="mt-2 text-[0.78rem] text-secondary">
          {rows.length > MAX_BARS && `Showing the first ${MAX_BARS} of ${rows.length} rows. `}
          {metrics.length > SERIES_COUNT && `Showing the first ${SERIES_COUNT} of ${metrics.length} metrics. `}
          See the table for everything.
        </div>
      )}
    </div>
  );
}
