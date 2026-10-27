import { MAX_BARS, toNumber, fmtFull, formatValue, formatLabel } from './resultUtils';
import { cn } from '@/lib/utils';

// Horizontal bars, one per row (capped at MAX_BARS).
export default function BarChart({ rows, label, metric }) {
  const shown = rows.slice(0, MAX_BARS);
  const values = shown.map((r) => toNumber(r[metric]) ?? 0);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;
  const zero = ((0 - min) / range) * 100;

  return (
    <div className="flex flex-col gap-0.5" role="img" aria-label={`Bar chart of ${metric} by ${label}`}>
      {shown.map((r, i) => {
        const v = values[i];
        const width = (Math.abs(v) / range) * 100;
        const left = v < 0 ? zero - width : zero;
        return (
          <div
            key={i}
            className="group grid grid-cols-[minmax(70px,32%)_1fr_minmax(52px,auto)] items-center gap-3 rounded-lg px-[0.4rem] py-[0.3rem] transition-colors hover:bg-subtle max-sm:grid-cols-[minmax(60px,34%)_1fr_auto] max-sm:gap-2 max-sm:px-[0.2rem]"
            title={`${formatLabel(r[label])}: ${fmtFull.format(v)}`}
          >
            <span className="truncate text-[0.82rem] text-secondary group-hover:text-primary">{formatLabel(r[label])}</span>
            <span className="relative h-[18px]">
              {/* Grows out from the zero line: rightwards, or leftwards for a negative value */}
              <span
                className={cn(
                  'absolute inset-y-0 animate-[barGrow_0.5s_var(--ease-smooth)_both] bg-accent transition-[filter] group-hover:brightness-92',
                  v < 0 ? 'origin-right rounded-l-[4px]' : 'origin-left rounded-r-[4px]'
                )}
                style={{ left: `${left}%`, width: `${Math.max(width, v === 0 ? 0 : 0.5)}%`, animationDelay: `${Math.min(i * 25, 400)}ms` }}
              />
            </span>
            <span className="text-right text-[0.82rem] font-medium whitespace-nowrap text-primary tabular-nums">{formatValue(toNumber(r[metric]))}</span>
          </div>
        );
      })}
      {rows.length > MAX_BARS && (
        <div className="mt-[0.6rem] text-[0.78rem] text-tertiary">Showing the first {MAX_BARS} of {rows.length} rows. See the table for all rows.</div>
      )}
    </div>
  );
}
