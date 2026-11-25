import { useMemo, useState } from 'react';
import { ChartBar, ChartColumn, ChartLine, ChartPie, Download, Gauge, Table2 } from 'lucide-react';
import { prettyName, analyseStats, analyse, canPie, downloadCsv } from './resultUtils';
import StatTiles from './StatTiles';
import ColumnChart from './charts/ColumnChart';
import BarChart from './charts/BarChart';
import PieChart from './charts/PieChart';
import LineChart from './charts/LineChart';
import ResultTable from './ResultTable';
import { cn } from '@/lib/utils';

// Renders a Genie query result (array of {column: value} rows) with a tab per useful view:
//   Summary  one-row answers with a few numbers (headline figures)
//   Line     time series (opens first for them)
//   Column   every metric side by side (opens first otherwise)
//   Pie      part-to-whole results only (see canPie)
//   Bar      one metric, ranked horizontally
//   Table    always
// Download (CSV of the full result) works from every tab.

const VIEWS = {
  summary: { label: 'Summary', Icon: Gauge },
  line: { label: 'Line', Icon: ChartLine },
  column: { label: 'Column', Icon: ChartColumn },
  pie: { label: 'Pie', Icon: ChartPie },
  bar: { label: 'Bar', Icon: ChartBar },
  table: { label: 'Table', Icon: Table2 },
};

// Single-metric views get the metric picker; Column shows every metric itself.
const SINGLE_METRIC = new Set(['line', 'pie', 'bar']);

export default function ResultView({ data }) {
  const chart = useMemo(() => analyse(data), [data]);
  const stats = useMemo(() => analyseStats(data), [data]);
  const [view, setView] = useState(null); // null = the first (best) view for this result
  const [metric, setMetric] = useState(null);

  if (!Array.isArray(data) || data.length === 0) return null;

  const activeMetric = chart && chart.metrics.includes(metric) ? metric : chart?.metrics[0];
  const pieOk = chart?.kind === 'bar' && canPie(data, activeMetric);
  const views = stats
    ? ['summary', 'table']
    : chart
      ? [chart.kind === 'line' && 'line', 'column', pieOk && 'pie', 'bar', 'table'].filter(Boolean)
      : ['table'];
  // A view that no longer applies (e.g. Pie after picking an average) falls back to the first.
  const shown = views.includes(view) ? view : views[0];

  const title = shown === 'column' && chart.metrics.length > 1
    ? chart.metrics.length === 2 ? chart.metrics.map(prettyName).join(' vs ') : `${chart.metrics.length} metrics`
    : prettyName(activeMetric);

  return (
    <div className="mt-4">
      <div className="mb-2 flex min-h-7.5 flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <span className="text-[0.78rem] text-secondary tabular-nums">
          {data.length} {data.length === 1 ? 'row' : 'rows'}
        </span>

        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2">
          {chart && SINGLE_METRIC.has(shown) && chart.metrics.length > 1 && (
            <select
              className="max-w-45 min-w-0 cursor-pointer rounded-lg border border-line bg-main px-2 py-[0.3rem] text-[0.78rem] text-ellipsis text-primary transition-colors hover:border-secondary focus:border-secondary focus:outline-none"
              value={activeMetric}
              onChange={(e) => setMetric(e.target.value)}
              aria-label="Metric to chart"
            >
              {chart.metrics.map((m) => <option key={m} value={m}>{prettyName(m)}</option>)}
            </select>
          )}

          {views.length > 1 && (
            <div className="inline-flex rounded-[9px] bg-line p-0.5" role="tablist" aria-label="Result view">
              {views.map((v) => {
                const { label, Icon } = VIEWS[v];
                return (
                  <button
                    type="button"
                    key={v}
                    role="tab"
                    aria-selected={shown === v}
                    title={label}
                    className={cn(
                      'flex items-center gap-1.5 rounded-[7px] px-[0.65rem] py-1 text-[0.78rem] font-medium transition duration-180 focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:outline-none max-sm:px-2',
                      shown === v
                        ? 'bg-main text-primary shadow-sm ring-1 ring-line'
                        : 'text-secondary hover:text-primary'
                    )}
                    onClick={() => setView(v)}
                  >
                    <Icon className="size-3.5 shrink-0" aria-hidden="true" />
                    <span className="max-sm:sr-only">{label}</span>
                  </button>
                );
              })}
            </div>
          )}

          <button
            type="button"
            title="Download as CSV"
            aria-label="Download as CSV"
            className="rounded-lg p-1.5 text-secondary transition-colors hover:bg-line hover:text-primary focus-visible:ring-2 focus-visible:ring-accent-soft focus-visible:outline-none"
            onClick={() => downloadCsv(data, chart ? `${prettyName(activeMetric)} by ${prettyName(chart.label)}` : 'result')}
          >
            <Download className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {shown === 'summary' ? (
        <StatTiles row={data[0]} stats={stats} />
      ) : shown === 'table' ? (
        <ResultTable data={data} />
      ) : (
        <div
          className="animate-[fadeIn_0.3s_var(--ease-smooth)_both] rounded-xl border border-line bg-main px-[1.1rem] pt-4 pb-[0.9rem] shadow-sm max-sm:px-3 max-sm:pt-[0.85rem] max-sm:pb-3"
          key={`${shown}-${activeMetric}`}
        >
          <div className="mb-[0.85rem] text-[0.9rem] font-semibold wrap-anywhere text-primary">
            {title} <span className="font-normal text-secondary">by {prettyName(chart.label)}</span>
          </div>
          {shown === 'column' && <ColumnChart rows={data} label={chart.label} metrics={chart.metrics} />}
          {shown === 'pie' && <PieChart rows={data} label={chart.label} metric={activeMetric} />}
          {shown === 'bar' && <BarChart rows={data} label={chart.label} metric={activeMetric} />}
          {shown === 'line' && <LineChart rows={data} label={chart.label} metric={activeMetric} />}
        </div>
      )}
    </div>
  );
}
