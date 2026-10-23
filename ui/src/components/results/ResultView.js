"use client";

import React, { useMemo, useState } from 'react';
import { isNumericColumn, isYear, formatCell, prettyName, analyseStats, analyse, canPie } from './resultUtils';
import StatTiles from './StatTiles';
import BarChart from './BarChart';
import LineChart from './LineChart';
import PieChart from './PieChart';
import styles from './ResultView.module.css';

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
    <div className={styles.result}>
      <div className={styles.toolbar}>
        <span className={styles.meta}>
          {data.length} {data.length === 1 ? 'row' : 'rows'}
        </span>
        <div className={styles.toolbarRight}>
          {chart && shown !== 'table' && chart.metrics.length > 1 && (
            <select
              className={styles.metricSelect}
              value={activeMetric}
              onChange={(e) => setMetric(e.target.value)}
              aria-label="Metric to chart"
            >
              {chart.metrics.map((m) => <option key={m} value={m}>{prettyName(m)}</option>)}
            </select>
          )}
          {visual && (
            <div className={styles.segmented} role="tablist" aria-label="Result view">
              {tabs.map((v) => (
                <button
                  key={v}
                  role="tab"
                  aria-selected={shown === v}
                  className={`${styles.segment} ${shown === v ? styles.segmentActive : ''}`}
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
        <div className={styles.chartCard} key={`${shown}-${chart.kind}-${activeMetric}`}>
          <div className={styles.chartTitle}>
            {prettyName(activeMetric)} <span className={styles.chartSubtitle}>by {prettyName(chart.label)}</span>
          </div>
          {shown === 'pie'
            ? <PieChart rows={data} label={chart.label} metric={activeMetric} />
            : chart.kind === 'line'
              ? <LineChart rows={data} label={chart.label} metric={activeMetric} />
              : <BarChart rows={data} label={chart.label} metric={activeMetric} />}
        </div>
      ) : (
        <div className={styles.tableContainer}>
          <table className={styles.dataTable}>
            <thead>
              <tr>
                {headers.map((h) => (
                  <th key={h} className={numericCols.has(h) ? styles.num : ''}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i}>
                  {headers.map((h) => (
                    <td key={h} className={numericCols.has(h) ? styles.num : ''}>
                      {row[h] === null || row[h] === undefined
                        ? <span className={styles.nullCell}>—</span>
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
