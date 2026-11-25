import { useId } from 'react';
import { MAX_BARS, toNumber, fmtFull, formatValue, formatLabel, prettyName, seriesColor } from '../resultUtils';
import useRovingIndex from '@/hooks/useRovingIndex';
import { cn } from '@/lib/utils';
import './charts.css';

// Horizontal bars for one metric, one row per category (capped at MAX_BARS).
// Each bar sits on a faint full-width track so short values still read against the whole.
// Hover, tap or the up / down arrow keys pick a row: the others dim and its value shows in full.
export default function BarChart({ rows, label, metric }) {
  const liveId = useId();
  const items = rows.slice(0, MAX_BARS).map((r) => ({ name: formatLabel(r[label]), value: toNumber(r[metric]) }));
  const [active, setActive, onKeyDown] = useRovingIndex(items.length, { next: 'ArrowDown', prev: 'ArrowUp' });

  const values = items.map((it) => it.value ?? 0);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;
  const zero = ((0 - min) / range) * 100; // % from the left where 0 sits
  const color = seriesColor(0);
  const picked = active !== null ? items[active] : null;

  return (
    <div className="viz">
      <div
        className="flex flex-col gap-1.5 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-accent-soft"
        tabIndex={0}
        role="group"
        aria-label={`Bar chart of ${prettyName(metric)} by ${prettyName(label)}. Use the up and down arrow keys to read each row.`}
        aria-describedby={liveId}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
      >
        {items.map((it, i) => {
          const v = it.value ?? 0;
          const width = (Math.abs(v) / range) * 100;
          const on = active === i;
          return (
            <div
              key={i}
              className={cn(
                'grid grid-cols-[minmax(72px,30%)_1fr_minmax(64px,auto)] items-center gap-3 rounded-lg px-2 py-1 transition-colors max-sm:grid-cols-[minmax(60px,34%)_1fr_auto] max-sm:gap-2 max-sm:px-1',
                on && 'bg-soft'
              )}
              onPointerEnter={() => setActive(i)}
              onPointerDown={() => setActive(i)}
            >
              <span className={cn('truncate text-[0.82rem] transition-colors', on ? 'font-medium text-primary' : 'text-secondary')} title={it.name}>
                {it.name}
              </span>

              <span className="relative h-5 overflow-hidden rounded-[5px] bg-(--viz-track)" aria-hidden="true">
                {min < 0 && <span className="absolute inset-y-0 w-px bg-secondary/50" style={{ left: `${zero}%` }} />}
                {it.value !== null && (
                  <span
                    className={cn('viz-bar absolute inset-y-0', v < 0 ? 'origin-right rounded-l-[5px]' : 'origin-left rounded-r-[5px]', on && 'brightness-110')}
                    style={{
                      left: `${v < 0 ? zero - width : zero}%`,
                      width: `${Math.max(width, v === 0 ? 0 : 0.6)}%`,
                      background: color,
                      opacity: active !== null && !on ? 0.4 : 1,
                      animationDelay: `${Math.min(i * 25, 400)}ms`,
                    }}
                  />
                )}
              </span>

              <span className={cn('text-right text-[0.82rem] whitespace-nowrap tabular-nums transition-colors', on ? 'font-semibold text-primary' : 'font-medium text-primary/85')}>
                {it.value === null ? '—' : on ? fmtFull.format(it.value) : formatValue(it.value)}
              </span>
            </div>
          );
        })}
      </div>

      <p id={liveId} className="sr-only" aria-live="polite">
        {picked ? `${picked.name}: ${picked.value === null ? 'no value' : fmtFull.format(picked.value)}` : ''}
      </p>

      {rows.length > MAX_BARS && (
        <div className="mt-[0.6rem] text-[0.78rem] text-secondary">Showing the first {MAX_BARS} of {rows.length} rows. See the table for all rows.</div>
      )}
    </div>
  );
}
