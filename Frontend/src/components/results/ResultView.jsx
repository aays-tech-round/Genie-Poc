import { useMemo, useState } from 'react';
import { isNumericColumn, isYear, formatCell, prettyName, analyseStats, analyse, canPie } from './resultUtils';
import StatTiles from './StatTiles';
import BarChart from './BarChart';
import LineChart from './LineChart';
import PieChart from './PieChart';
import { cn } from '@/lib/utils';

const cell = 'border-b border-line px-4 py-[0.65rem] whitespace-nowrap max-sm:px-3 max-sm:py-[0.55rem]';

// Renders a Genie query result (array of {column: value} rows) as a table,
// plus a bar or line chart, or headline figures, when the shape of the data suits one.
// Part-to-whole results also get a Pie option (see canPie); bars stay the default.

export default function ResultView({ data }) {
  const chart = useMemo(() => analyse(data), [data]);
  const stats = useMemo(() => analyseStats(data), [data]);
  const visual = chart ? 'chart' : stats ? 'summary' : null;
  // Open on the chart / headline figures; the table is one click away.
  const [view, setView] = useState('visual');
  const [metric, setMetric] = useState(null);

  if (!Array.isArray(data) || data.length === 0) return null;

  const headers = Object.keys(data[0]);
  const numericCols = new Set(
    headers.filter((h) => isNumericColumn(data, h) && !data.every((r) => r[h] == null || isYear(r[h])))
  );
  const activeMetric = chart && chart.metrics.includes(metric) ? metric : chart?.metrics[0];
  const pieOk = chart?.kind === 'bar' && canPie(data, activeMetric);
  // Switching to a metric that can't be a pie (e.g. an average) falls back to bars
  const shown = view === 'pie' && !pieOk ? 'visual' : view;
  const tabs = pieOk ? ['visual', 'pie', 'table'] : ['visual', 'table'];
  const tabLabel = (v) =>
    v === 'table' ? 'Table' : v === 'pie' ? 'Pie' : visual === 'summary' ? 'Summary' : pieOk ? 'Bar' : 'Chart';

  return (
    <div className="mt-4">
      <div className="mb-2 flex min-h-[30px] items-center justify-between gap-3">
        <span className="text-[0.78rem] text-tertiary tabular-nums">
          {data.length} {data.length === 1 ? 'row' : 'rows'}
        </span>
        <div className="flex min-w-0 items-center gap-2">
          {chart && shown !== 'table' && chart.metrics.length > 1 && (
            <select
              className="max-w-[180px] min-w-0 cursor-pointer rounded-lg border border-line bg-elevated px-2 py-[0.3rem] text-[0.78rem] text-ellipsis text-primary transition-colors hover:border-strong focus:border-strong focus:outline-none"
              value={activeMetric}
              onChange={(e) => setMetric(e.target.value)}
              aria-label="Metric to chart"
            >
              {chart.metrics.map((m) => <option key={m} value={m}>{prettyName(m)}</option>)}
            </select>
          )}
          {visual && (
            <div className="inline-flex rounded-[9px] bg-hover p-0.5" role="tablist" aria-label="Result view">
              {tabs.map((v) => (
                <button
                  key={v}
                  role="tab"
                  aria-selected={shown === v}
                  className={cn(
                    'rounded-[7px] px-[0.7rem] py-1 text-[0.78rem] font-medium transition duration-[180ms]',
                    shown === v
                      ? 'bg-elevated text-primary shadow-[var(--elevation-sm),0_0_0_1px_var(--border-light)]'
                      : 'text-secondary hover:text-primary'
                  )}
                  onClick={() => setView(v)}
                >
                  {tabLabel(v)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {shown === 'visual' && stats ? (
        <StatTiles row={data[0]} stats={stats} />
      ) : shown !== 'table' && chart ? (
        <div
          className="animate-[fadeIn_0.3s_var(--ease-smooth)_both] rounded-xl border border-line bg-elevated px-[1.1rem] pt-4 pb-[0.9rem] shadow-sm max-sm:px-3 max-sm:pt-[0.85rem] max-sm:pb-3"
          key={`${shown}-${chart.kind}-${activeMetric}`}
        >
          <div className="mb-[0.85rem] text-[0.9rem] font-semibold wrap-anywhere text-primary">
            {prettyName(activeMetric)} <span className="font-normal text-secondary">by {prettyName(chart.label)}</span>
          </div>
          {shown === 'pie'
            ? <PieChart rows={data} label={chart.label} metric={activeMetric} />
            : chart.kind === 'line'
              ? <LineChart rows={data} label={chart.label} metric={activeMetric} />
              : <BarChart rows={data} label={chart.label} metric={activeMetric} />}
        </div>
      ) : (
        <div className="max-h-[460px] animate-[fadeOnly_0.25s_ease_both] overflow-auto rounded-xl border border-line bg-elevated shadow-sm scrollbar-thin">
          <table className="w-full border-separate border-spacing-0 text-left text-sm tabular-nums">
            <thead>
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className={cn(
                      cell,
                      'sticky top-0 z-1 bg-subtle text-[0.8rem] font-semibold tracking-[0.01em] text-secondary',
                      numericCols.has(h) ? 'text-right' : 'text-left'
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="transition-colors hover:bg-accent-soft [&:last-child>td]:border-b-0">
                  {headers.map((h) => (
                    <td key={h} className={cn(cell, numericCols.has(h) && 'text-right')}>
                      {row[h] === null || row[h] === undefined
                        ? <span className="text-tertiary">—</span>
                        : formatCell(row[h], numericCols.has(h))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
