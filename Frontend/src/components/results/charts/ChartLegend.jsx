import { cn } from '@/lib/utils';

// Legend that doubles as the show / hide control for each series.
// Clicking toggles a series; hovering or focusing a visible one calls onHighlight(key) so the
// chart can dim the others (onHighlight(null) when the pointer or focus leaves).
//   series: [{ key, name, color }]   hidden: Set of hidden keys
export default function ChartLegend({ series, hidden, onToggle, onHighlight }) {
  return (
    <ul className="flex min-w-0 flex-wrap gap-1" aria-label="Metrics">
      {series.map((s) => {
        const on = !hidden.has(s.key);
        return (
          <li key={s.key}>
            <button
              type="button"
              aria-pressed={on}
              title={on ? `Hide ${s.name}` : `Show ${s.name}`}
              className={cn(
                'flex max-w-60 items-center gap-1.5 rounded-md px-2 py-1 text-[0.78rem] transition-colors hover:bg-soft focus-visible:bg-soft focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:outline-none',
                on ? 'text-primary' : 'text-secondary line-through decoration-secondary/60'
              )}
              onClick={() => onToggle(s.key)}
              onPointerEnter={() => on && onHighlight(s.key)}
              onPointerLeave={() => onHighlight(null)}
              onFocus={() => on && onHighlight(s.key)}
              onBlur={() => onHighlight(null)}
            >
              <span
                className={cn('size-2.5 shrink-0 rounded-[3px] border', on ? 'border-transparent' : 'border-secondary')}
                style={{ background: on ? s.color : 'transparent' }}
                aria-hidden="true"
              />
              <span className="truncate">{s.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
