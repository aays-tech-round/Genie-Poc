import { useState } from 'react';
import { fmtFull, formatLabel, formatValue, toNumber } from './resultUtils';
import { cn } from '@/lib/utils';

const SIZE = 200;
const OUTER = 96;
const INNER = 62;
const C = SIZE / 2;

// Slice colours, in order: the theme's own colours, with red and green kept apart.
const SLICE_COLORS = ['accent', 'success', 'secondary', 'danger', 'accent-soft', 'line'];

const fmtPct = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 });

// Donut segment from angle a0 to a1 (radians, 0 = 12 o'clock, clockwise).
const arcPath = (a0, a1) => {
  const pt = (a, r) => [C + r * Math.sin(a), C - r * Math.cos(a)];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = pt(a0, OUTER);
  const [x1, y1] = pt(a1, OUTER);
  const [x2, y2] = pt(a1, INNER);
  const [x3, y3] = pt(a0, INNER);
  return `M${x0} ${y0}A${OUTER} ${OUTER} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${INNER} ${INNER} 0 ${large} 0 ${x3} ${y3}Z`;
};

// Part-to-whole donut. Slices keep the row order Genie returned, so a colour always
// belongs to the same category; the legend names every slice with its value and share.
// Only rendered for results that pass canPie (3–6 positive, additive values).
export default function PieChart({ rows, label, metric }) {
  const [active, setActive] = useState(null);

  const slices = rows.map((r, i) => ({ name: formatLabel(r[label]), value: toNumber(r[metric]), color: `var(--${SLICE_COLORS[i % SLICE_COLORS.length]})` }));
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let angle = 0;
  slices.forEach((s) => {
    s.share = s.value / total;
    s.a0 = angle;
    angle += s.share * 2 * Math.PI;
    s.a1 = angle;
  });

  const focus = active !== null ? slices[active] : null;

  return (
    <div className="flex flex-wrap items-center gap-7 max-sm:gap-4">
      <div className="relative size-[200px] shrink-0 max-sm:mx-auto max-sm:size-[170px]">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="block size-full overflow-visible"
          role="img"
          aria-label={`Pie chart of ${metric} by ${label}`}
          onPointerLeave={() => setActive(null)}
        >
          {slices.map((s, i) => (
            <path
              key={i}
              d={arcPath(s.a0, s.a1)}
              fill={s.color}
              // The card-coloured stroke leaves a gap between neighbouring slices. The entrance
              // animation fills backwards, not both: a held end state would override the dimming.
              className={cn(
                'origin-[100px_100px] animate-[sliceIn_0.5s_var(--ease-smooth)_backwards] cursor-default stroke-main stroke-2 [stroke-linejoin:round] transition-opacity duration-200',
                active !== null && active !== i && 'opacity-35'
              )}
              style={{ animationDelay: `${i * 50}ms` }}
              onPointerEnter={() => setActive(i)}
            >
              <title>{`${s.name}: ${fmtFull.format(s.value)} (${fmtPct.format(s.share)})`}</title>
            </path>
          ))}
        </svg>
        {/* Centre readout: the total, or the hovered slice */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center" aria-hidden="true">
          <div className="text-[1.35rem] font-semibold tracking-[-0.02em] text-primary tabular-nums">
            {formatValue(focus ? focus.value : total)}
          </div>
          <div className="max-w-[110px] truncate text-xs text-secondary" title={focus ? focus.name : 'Total'}>
            {focus ? fmtPct.format(focus.share) : 'Total'}
          </div>
        </div>
      </div>

      <ul className="flex max-w-[400px] min-w-[220px] flex-1 flex-col gap-0.5 max-sm:max-w-none max-sm:min-w-full">
        {slices.map((s, i) => (
          <li
            key={i}
            className={cn(
              'grid grid-cols-[10px_minmax(0,1fr)_auto_3.5rem] items-center gap-[0.65rem] rounded-lg px-2 py-[0.4rem] text-[0.85rem] outline-none transition-colors hover:bg-soft focus-visible:bg-soft focus-visible:ring-2 focus-visible:ring-accent-soft',
              active === i && 'bg-soft'
            )}
            tabIndex={0}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
          >
            <span className="size-2.5 rounded-[3px]" style={{ background: s.color }} aria-hidden="true" />
            <span className={cn('truncate', active === i ? 'text-primary' : 'text-secondary')} title={s.name}>{s.name}</span>
            <span className="text-right font-medium text-primary tabular-nums">{formatValue(s.value)}</span>
            <span className="text-right text-secondary tabular-nums">{fmtPct.format(s.share)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
