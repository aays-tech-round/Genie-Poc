import { fmtFull } from '../resultUtils';

// `total`: for stacked columns. Lists the segments top-down (matching the stack) and adds a
// Total line under them.
export default function ChartTooltip({ active, payload, label, total = false }) {
  if (!active || !payload?.length) return null;
  const title = payload[0].payload?.name ?? label;
  const rows = total ? [...payload].reverse() : payload;
  const sum = payload.reduce((t, p) => t + (p.value ?? 0), 0);
  return (
    <div className="max-w-65 min-w-37.5 rounded-[10px] border border-line bg-main px-3 py-2 shadow-lg">
      <div className="mb-1.5 text-[0.78rem] font-semibold wrap-anywhere text-primary">{title}</div>
      <ul className="flex flex-col gap-1">
        {rows.map((p) => (
          <li key={p.dataKey} className="grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-2 text-[0.75rem]">
            <span className="h-0.5 w-3 rounded-full" style={{ background: p.color ?? p.payload?.fill }} />
            <span className="truncate text-secondary">{p.name}</span>
            <span className="text-right font-semibold text-primary tabular-nums">
              {p.value === null || p.value === undefined ? '—' : fmtFull.format(p.value)}
            </span>
          </li>
        ))}
      </ul>
      {total && (
        <div className="mt-1.5 grid grid-cols-[12px_minmax(0,1fr)_auto] items-center gap-2 border-t border-line pt-1.5 text-[0.75rem]">
          <span />
          <span className="font-medium text-primary">Total</span>
          <span className="text-right font-semibold text-primary tabular-nums">{fmtFull.format(sum)}</span>
        </div>
      )}
    </div>
  );
}
