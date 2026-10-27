import { toNumber, fmtFull, fmtCompact, prettyName } from './resultUtils';
import { cn } from '@/lib/utils';

// Headline figures for a one-row answer.
export default function StatTiles({ row, stats }) {
  const single = stats.metrics.length === 1;
  return (
    <div
      className={cn(
        'grid gap-3',
        single ? 'grid-cols-[minmax(220px,max-content)]' : 'grid-cols-[repeat(auto-fit,minmax(180px,1fr))]'
      )}
    >
      {stats.metrics.map((m, i) => {
        const n = toNumber(row[m]);
        const compact = fmtCompact.format(n);
        const full = fmtFull.format(n);
        return (
                    // Accent bar down the left edge; a lone figure gets a hero size and a tinted card
          <div
            key={m}
            className={cn(
              'relative animate-fade-up overflow-hidden rounded-xl border border-line bg-main shadow-sm before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-accent',
              single ? 'bg-accent-soft px-6 py-5' : 'px-[1.15rem] py-4'
            )}
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="mb-[0.35rem] text-[0.8rem] font-medium text-secondary">{prettyName(m)}</div>
            <div
              className={cn(
                'leading-[1.15] font-semibold tracking-[-0.02em] whitespace-nowrap text-primary',
                single ? 'text-[3rem] max-sm:text-[2.25rem]' : 'text-[1.75rem]'
              )}
              title={full}
            >
              {Math.abs(n) >= 1e4 ? compact : full}
            </div>
            {Math.abs(n) >= 1e4 && <div className="mt-[0.3rem] text-[0.78rem] text-secondary tabular-nums">{full}</div>}
          </div>
        );
      })}
      {stats.context.length > 0 && (
        <div className="col-span-full flex flex-wrap gap-[0.4rem]">
          {stats.context.map((c) => (
            <span key={c.name} className="rounded-full bg-line px-[0.6rem] py-[0.2rem] text-[0.78rem] text-primary">
              <span className="text-secondary">{c.name}</span> {c.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
