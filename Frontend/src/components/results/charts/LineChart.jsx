import { useId } from 'react';
import { Area, AreaChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { toNumber, timeValue, fmtCompact, formatValue, formatLabel, prettyName } from '../resultUtils';
import { animation, axisTick, gridStroke, lineCursor } from './chartTheme';
import ChartTooltip from './ChartTooltip';
import './charts.css';

const COLOR = 'var(--series-1)';

// Time series: points sorted by date, a line with a soft fill under it, and the latest value
// labelled at the end. Hover or the arrow keys (after focusing the chart) open the tooltip.
export default function LineChart({ rows, label, metric }) {
  const gradientId = `line-fill-${useId().replace(/[^\w-]/g, '')}`;

  const data = rows
    .map((r) => ({ name: formatLabel(r[label]), t: timeValue(r[label]), value: toNumber(r[metric]) }))
    .filter((p) => p.value !== null)
    .sort((a, b) => a.t - b.t);

  if (data.length < 2) return <div className="mt-[0.6rem] text-[0.78rem] text-secondary">Not enough data to chart.</div>;

  // Only the last point carries a value label.
  const lastLabel = ({ x, y, index, value }) =>
    index === data.length - 1 && (
      <text x={x + 8} y={y} dominantBaseline="middle" fill="var(--primary)" fontSize={12} fontWeight={600}>
        {formatValue(value)}
      </text>
    );

  return (
    <div className="viz">
      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 16, right: 56, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={COLOR} stopOpacity={0.22} />
              <stop offset="100%" stopColor={COLOR} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={gridStroke} />
          <XAxis dataKey="name" tick={axisTick} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis tick={axisTick} tickLine={false} axisLine={false} tickFormatter={(v) => fmtCompact.format(v)} width="auto" domain={['auto', 'auto']} />
          <Tooltip content={<ChartTooltip />} cursor={lineCursor} />
          <Area
            type="monotone"
            dataKey="value"
            name={prettyName(metric)}
            stroke={COLOR}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            {...animation}
            activeDot={{ r: 5, fill: COLOR, stroke: 'var(--main)', strokeWidth: 2 }}
          >
            <LabelList dataKey="value" content={lastLabel} />
          </Area>
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
