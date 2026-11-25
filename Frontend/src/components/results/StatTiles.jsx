import { TrendingDown, TrendingUp } from 'lucide-react';
import { toNumber, fmtFull, fmtCompact, prettyName } from './resultUtils';
import { cn } from '@/lib/utils';

const words = (col) => String(col).replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[\s_.-]+/);
const PERCENT_WORDS = new Set(['pct', 'percent', 'percentage', 'perc']);
const CHANGE_WORDS = new Set(['change', 'growth', 'delta', 'diff', 'difference', 'yoy', 'mom', 'qoq', 'variance']);

const fmtPctValue = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });

function describe(metric, n) {
  const w = words(metric);
  const isPercent = w.some((x) => PERCENT_WORDS.has(x));
  const isChange = w.some((x) => CHANGE_WORDS.has(x));
  const big = Math.abs(n) >= 1e4;
  return {
    main: isPercent ? `${fmtPctValue.format(n)}%` : big ? fmtCompact.format(n) : fmtFull.format(n),
    full: !isPercent && big ? fmtFull.format(n) : null, // exact figure under a compact one
    trend: isChange && n !== 0 ? (n > 0 ? 'up' : 'down') : null,
  };
}

export default function StatTiles({ row, stats }) {
  const single = stats.metrics.length === 1;
  return (
    <div className="animate-fade-up">
      {/* gap-px over a line-coloured background draws the dividers, wherever the tiles wrap */}
      <div
        className={cn(
          'grid gap-px overflow-hidden rounded-xl border border-line bg-line shadow-sm',
          single ? 'grid-cols-1 sm:max-w-sm' : 'grid-cols-[repeat(auto-fit,minmax(190px,1fr))]'
        )}
      >
        {stats.metrics.map((m) => {
          const n = toNumber(row[m]);
          const { main, full, trend } = describe(m, n);
          const TrendIcon = trend === 'up' ? TrendingUp : TrendingDown;
          return (
            <div key={m} className={cn('flex flex-col bg-main', single ? 'px-6 py-5' : 'px-5 py-4')}>
              <div className="text-[0.72rem] font-semibold tracking-[0.05em] text-secondary uppercase">{prettyName(m)}</div>
              <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span
                  className={cn('leading-none font-semibold tracking-[-0.02em] whitespace-nowrap text-primary', single ? 'text-[2.6rem] max-sm:text-[2.1rem]' : 'text-[1.9rem]')}
                  title={fmtFull.format(n)}
                >
                  {main}
                </span>
                {trend && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.72rem] font-semibold',
                      trend === 'up' ? 'bg-success/12 text-success' : 'bg-danger/12 text-danger'
                    )}
                  >
                    <TrendIcon className="size-3.5" aria-hidden="true" />
                    {trend === 'up' ? 'Up' : 'Down'}
                  </span>
                )}
              </div>
              {full && <div className="mt-2 text-[0.78rem] text-secondary tabular-nums">{full}</div>}
            </div>
          );
        })}
      </div>

      {stats.context.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {stats.context.map((c) => (
            <span key={c.name} className="rounded-full border border-line bg-soft px-2.5 py-0.5 text-[0.76rem] text-primary">
              <span className="text-secondary">{c.name}:</span> {c.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
