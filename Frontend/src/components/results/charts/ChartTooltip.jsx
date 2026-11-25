import { fmtFull } from '../resultUtils';

// Hover card listing every series' value for one category. Values lead (strong ink), series
// names follow; each row is keyed by a short stroke of the series colour. Positioned by the
// caller through `style`. Hidden from screen readers: the chart announces the same values in
// its own live region.
//   items: [{ key, name, color, value }]   value: number or null
export default function ChartTooltip({ title, items, style }) {
  return (
    <div
      className="pointer-events-none absolute z-10 max-w-65 min-w-37.5 animate-[fadeOnly_0.12s_ease_both] rounded-[10px] border border-line bg-main px-3 py-2 shadow-lg"
      style={style}
      aria-hidden="true"
    >
      <div className="mb-1.5 text-[0.78rem] font-semibold wrap-anywhere text-primary">{title}</div>
      <ul className="flex flex-col gap-1">
        {items.map((it) => (
          <li key={it.key} className="grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-2 text-[0.75rem]">
            <span className="h-0.5 w-3 rounded-full" style={{ background: it.color }} />
            <span className="truncate text-secondary">{it.name}</span>
            <span className="text-right font-semibold text-primary tabular-nums">
              {it.value === null ? '—' : fmtFull.format(it.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
