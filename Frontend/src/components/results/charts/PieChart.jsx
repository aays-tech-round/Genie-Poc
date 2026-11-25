import { useState } from 'react';
import { Pie, PieChart as RPieChart, ResponsiveContainer } from 'recharts';
import { formatLabel, formatValue, toNumber, seriesColor } from '../resultUtils';
import { animation } from './chartTheme';
import { cn } from '@/lib/utils';
import './charts.css';

const fmtPct = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 });

export default function PieChart({ rows, label, metric }) {
  const [active, setActive] = useState(null);

  const slices = rows.map((r, i) => ({ name: formatLabel(r[label]), value: toNumber(r[metric]), fill: seriesColor(i) }));
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  const focus = active !== null ? slices[active] : null;

  return (
    <div className="viz flex items-center justify-center gap-12 py-1 max-md:gap-8 max-sm:flex-col max-sm:gap-5">
      <div className="relative size-50 shrink-0 max-sm:size-44">
        <ResponsiveContainer width="100%" height="100%">
          <RPieChart accessibilityLayer={false}>
            {/* The card-coloured stroke leaves a gap between neighbouring slices. */}
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="64%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              stroke="var(--main)"
              strokeWidth={2}
              {...animation}
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
            />
          </RPieChart>
        </ResponsiveContainer>
        {/* Centre readout: the total, or the hovered slice */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center" aria-hidden="true">
          <div className="text-[1.35rem] font-semibold tracking-[-0.02em] text-primary tabular-nums">
            {formatValue(focus ? focus.value : total)}
          </div>
          <div className="max-w-27.5 truncate text-xs text-secondary">
            {focus ? fmtPct.format(focus.value / total) : 'Total'}
          </div>
        </div>
      </div>

      <ul className="flex w-full max-w-90 min-w-0 flex-col gap-0.5" aria-label={`${metric} by ${label}`}>
        {slices.map((s, i) => (
          <li
            key={i}
            className={cn(
              'grid grid-cols-[10px_minmax(0,1fr)_4.5rem_3.25rem] items-center gap-3 rounded-lg px-2 py-[0.4rem] text-[0.85rem] outline-none transition-colors hover:bg-soft focus-visible:bg-soft focus-visible:ring-2 focus-visible:ring-accent-soft',
              active === i && 'bg-soft'
            )}
            tabIndex={0}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
          >
            <span className="size-2.5 rounded-[3px]" style={{ background: s.fill }} aria-hidden="true" />
            <span className={cn('truncate', active === i ? 'text-primary' : 'text-secondary')} title={s.name}>{s.name}</span>
            <span className="text-right font-medium text-primary tabular-nums">{formatValue(s.value)}</span>
            <span className="text-right text-secondary tabular-nums">{fmtPct.format(s.value / total)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
