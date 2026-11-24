import { useEffect, useMemo, useState } from 'react';
import { isNumericColumn, isYear, formatCell, prettyName, analyseStats, analyse, canPie } from './resultUtils';
import StatTiles from './StatTiles';
import BarChart from './BarChart';
import LineChart from './LineChart';
import PieChart from './PieChart';
import Spinner from '@/components/ui/Spinner';
import { getVisualizationUrl } from '@/lib/genieApi';
import { cn } from '@/lib/utils';

const cell = 'border-b border-line px-4 py-[0.65rem] whitespace-nowrap max-sm:px-3 max-sm:py-[0.55rem]';
const card = 'rounded-xl border border-line bg-main px-[1.1rem] pt-4 pb-[0.9rem] shadow-sm max-sm:px-3 max-sm:pt-[0.85rem] max-sm:pb-3';

const isId = (v) => typeof v === 'string' && v.length > 0;

// Renders a Genie query result (array of {column: value} rows) as a table,
// plus a bar or line chart, or headline figures, when the shape of the data suits one.
// Part-to-whole results also get a Pie option (see canPie); bars stay the default.
// When Genie rendered its own chart (`visualization`), that is shown first instead; if it
// can't be loaded, the view falls back to the charts drawn here.

export default function ResultView({ data, visualization }) {
  const chart = useMemo(() => analyse(data), [data]);
  const stats = useMemo(() => analyseStats(data), [data]);
  const visual = chart ? 'chart' : stats ? 'summary' : null;

  const vizMessageId = visualization?.message_id;
  const vizConversationId = visualization?.conversation_id;
  const vizAttachmentId = visualization?.attachment_id;
  const vizKey = [vizMessageId, vizConversationId, vizAttachmentId].every(isId)
    ? `${vizConversationId}/${vizMessageId}/${vizAttachmentId}`
    : null;
  const [vizResult, setVizResult] = useState({ key: null, url: null });
  useEffect(() => {
    if (!vizKey) return undefined;
    let cancelled = false;
    getVisualizationUrl({ message_id: vizMessageId, conversation_id: vizConversationId, attachment_id: vizAttachmentId })
      .then((url) => {
        if (!cancelled) setVizResult({ key: vizKey, url });
      })
      .catch((err) => {
        console.warn("Couldn't load Genie's chart; showing the built-in chart instead:", err);
        if (!cancelled) setVizResult({ key: vizKey, url: null });
      });
    return () => {
      cancelled = true;
    };
  }, [vizKey, vizMessageId, vizConversationId, vizAttachmentId]);
  const vizState = !vizKey ? 'none' : vizResult.key !== vizKey ? 'loading' : vizResult.url ? 'ready' : 'failed';
  const hasGenieViz = vizState === 'loading' || vizState === 'ready';

  // Open on Genie's chart, else the chart / headline figures; the table is one click away.
  const [view, setView] = useState(() => (vizKey ? 'genie' : 'visual'));
  const [metric, setMetric] = useState(null);

  if (!Array.isArray(data) || data.length === 0) return null;

  const headers = Object.keys(data[0]);
  const numericCols = new Set(
    headers.filter((h) => isNumericColumn(data, h) && !data.every((r) => r[h] == null || isYear(r[h])))
  );
  const activeMetric = chart && chart.metrics.includes(metric) ? metric : chart?.metrics[0];
  const pieOk = chart?.kind === 'bar' && canPie(data, activeMetric);
  // Switching to a metric that can't be a pie (e.g. an average) falls back to bars;
  // a Genie chart that couldn't be loaded falls back to the built-in visual.
  const shown = (view === 'pie' && !pieOk) || (view === 'genie' && !hasGenieViz) ? 'visual' : view;
  const tabs = [
    ...(hasGenieViz ? ['genie'] : []),
    ...(visual ? (pieOk ? ['visual', 'pie'] : ['visual']) : []),
    'table',
  ];
  const tabLabel = (v) =>
    v === 'genie' ? 'Genie' : v === 'table' ? 'Table' : v === 'pie' ? 'Pie' : visual === 'summary' ? 'Summary' : pieOk ? 'Bar' : 'Chart';
  const vizTitle = visualization?.title;

  return (
    <div className="mt-4">
      <div className="mb-2 flex min-h-[30px] items-center justify-between gap-3">
        <span className="text-[0.78rem] text-secondary tabular-nums">
          {data.length} {data.length === 1 ? 'row' : 'rows'}
        </span>
        <div className="flex min-w-0 items-center gap-2">
          {chart && shown !== 'table' && shown !== 'genie' && chart.metrics.length > 1 && (
            <select
              className="max-w-[180px] min-w-0 cursor-pointer rounded-lg border border-line bg-main px-2 py-[0.3rem] text-[0.78rem] text-ellipsis text-primary transition-colors hover:border-secondary focus:border-secondary focus:outline-none"
              value={activeMetric}
              onChange={(e) => setMetric(e.target.value)}
              aria-label="Metric to chart"
            >
              {chart.metrics.map((m) => <option key={m} value={m}>{prettyName(m)}</option>)}
            </select>
          )}
          {tabs.length > 1 && (
            <div className="inline-flex rounded-[9px] bg-line p-0.5" role="tablist" aria-label="Result view">
              {tabs.map((v) => (
                <button
                  type="button"
                  key={v}
                  role="tab"
                  aria-selected={shown === v}
                  className={cn(
                    'rounded-[7px] px-[0.7rem] py-1 text-[0.78rem] font-medium transition duration-[180ms]',
                    shown === v
                      ? 'bg-main text-primary shadow-sm ring-1 ring-line'
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

      {shown === 'genie' ? (
        <div className={cn('animate-[fadeIn_0.3s_var(--ease-smooth)_both]', card)} key="genie">
          {vizTitle && (
            <div className="mb-[0.85rem] text-[0.9rem] font-semibold wrap-anywhere text-primary">{vizTitle}</div>
          )}
          {vizState === 'ready' ? (
            <img
              src={vizResult.url}
              alt={vizTitle || 'Chart generated by Genie'}
              className="block h-auto w-full rounded-lg"
              // An image the browser can't decode falls back like a failed download
              onError={() => setVizResult({ key: vizKey, url: null })}
            />
          ) : (
            <div className="flex h-[220px] items-center justify-center gap-2 text-[0.8rem] text-secondary" role="status">
              <Spinner className="size-5" aria-hidden="true" />
              Loading Genie's chart…
            </div>
          )}
        </div>
      ) : shown === 'visual' && stats ? (
        <StatTiles row={data[0]} stats={stats} />
      ) : shown !== 'table' && chart ? (
        <div
          className={cn('animate-[fadeIn_0.3s_var(--ease-smooth)_both]', card)}
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
        <div className="max-h-[460px] animate-[fadeOnly_0.25s_ease_both] overflow-auto rounded-xl border border-line bg-main shadow-sm scrollbar-thin">
          <table className="w-full border-separate border-spacing-0 text-left text-sm tabular-nums">
            <thead>
              <tr>
                {headers.map((h) => (
                  <th
                    key={h}
                    className={cn(
                      cell,
                      'sticky top-0 z-1 bg-soft text-[0.8rem] font-semibold tracking-[0.01em] text-secondary',
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
                        ? <span className="text-secondary">—</span>
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
