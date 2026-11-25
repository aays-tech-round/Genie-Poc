import { cn } from '@/lib/utils';


export default function ChartLegend({ series, hidden, onToggle }) {
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
