import { Bar, BarChart as RBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { MAX_BARS, toNumber, formatValue, formatLabel, prettyName, seriesColor } from '../resultUtils';
import { animation, barCursor, truncate } from './chartTheme';
import ChartTooltip from './ChartTooltip';
import './charts.css';

// Horizontal bars for one metric, one row per category (capped at MAX_BARS). Names run down
// the left, values line up in a column on the right, and each bar sits on a faint full-width
// track so short values still read against the whole. Hover or the arrow keys (after
// focusing the chart) open the tooltip.

const ROW = 34; // px per row
const nameTick = { fill: 'var(--secondary)', fontSize: 12 };
const valueTick = { fill: 'var(--primary)', fontSize: 12, fontWeight: 600 };

export default function BarChart({ rows, label, metric }) {
  const data = rows.slice(0, MAX_BARS).map((r) => {
    const value = toNumber(r[metric]);
    return { name: formatLabel(r[label]), value, shown: formatValue(value) };
  });
  // ~8px per character at 12px, plus the gap Recharts leaves between label and bar.
  const nameWidth = Math.min(200, Math.max(72, Math.max(...data.map((d) => d.name.length)) * 8 + 20));
  const valueWidth = Math.max(...data.map((d) => d.shown.length)) * 7.5 + 16;

  // Each row's background: the faint full-width track, plus the row's value right-aligned in
  // the margin after it, so values line up in one column whatever the bar length.
  const trackWithValue = ({ x, y, width, height, index }) => (
    <g>
      <rect x={x} y={y} width={width} height={height} rx={5} fill="var(--viz-track)" />
      <text x={x + width + valueWidth - 4} y={y + height / 2} textAnchor="end" dominantBaseline="middle" {...valueTick}>
        {data[index].shown}
      </text>
    </g>
  );

  return (
    <div className="viz">
      <ResponsiveContainer width="100%" height={data.length * ROW + 8}>
        <RBarChart data={data} layout="vertical" margin={{ top: 4, right: valueWidth, left: 0, bottom: 4 }} barCategoryGap={8}>
          <XAxis type="number" hide domain={[(min) => Math.min(0, min), (max) => Math.max(0, max)]} />
          <YAxis
            type="category"
            dataKey="name"
            width={nameWidth}
            tick={nameTick}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => truncate(v, Math.floor((nameWidth - 20) / 8))}
          />
          <Tooltip content={<ChartTooltip />} cursor={barCursor} />
          <Bar
            dataKey="value"
            name={prettyName(metric)}
            fill={seriesColor(0)}
            radius={5}
            maxBarSize={20}
            background={trackWithValue}
            {...animation}
          />
        </RBarChart>
      </ResponsiveContainer>

      {rows.length > MAX_BARS && (
        <div className="mt-[0.6rem] text-[0.78rem] text-secondary">Showing the first {MAX_BARS} of {rows.length} rows. See the table for all rows.</div>
      )}
    </div>
  );
}
