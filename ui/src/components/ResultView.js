"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import styles from './ResultView.module.css';

// Renders a Genie query result (array of {column: value} rows) as a table,
// plus a bar or line chart when the shape of the data suits one.

const MAX_BARS = 25;

const toNumber = (v) => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : NaN;
};

const isNumericColumn = (rows, col) => {
  let seen = 0;
  for (const r of rows) {
    const n = toNumber(r[col]);
    if (Number.isNaN(n)) return false;
    if (n !== null) seen++;
  }
  return seen > 0;
};

const isYear = (v) => /^(19|20)\d{2}$/.test(String(v ?? '').trim());
const isDateLike = (v) => {
  const s = String(v ?? '').trim();
  return isYear(s) || (/^\d{4}-\d{2}(-\d{2})?([T ].*)?$/.test(s) && !Number.isNaN(Date.parse(s)));
};
const timeValue = (v) => (isYear(v) ? Number(v) * 1e10 : Date.parse(String(v).trim()));

const fmtFull = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
const fmtCompact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
const formatValue = (n) => (n === null ? '—' : Math.abs(n) >= 1e6 ? fmtCompact.format(n) : fmtFull.format(n));

// Genie returns numbers as strings, sometimes in scientific notation ("1.37482663E8").
// Year columns stay as-is; other numbers get thousands separators.
const formatCell = (v, numeric) => {
  if (!numeric) return String(v);
  const n = toNumber(v);
  return n === null || Number.isNaN(n) ? String(v) : fmtFull.format(n);
};

const formatLabel = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  const s = String(v);
  // Trim midnight timestamps down to the date
  return s.replace(/^(\d{4}-\d{2}-\d{2})[T ]00:00:00(\.0+)?Z?$/, '$1');
};

// "ytd_revenue_2025" -> "YTD revenue 2025"
const ACRONYMS = new Set(['ytd', 'mtd', 'qtd', 'yoy', 'mom', 'usa', 'us', 'uk', 'id', 'kpi', 'pct']);
const prettyName = (col) => {
  const words = String(col).replace(/([a-z])([A-Z])/g, '$1 $2').split(/[\s_]+/).filter(Boolean);
  return words
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      return i === 0 ? lower[0].toUpperCase() + lower.slice(1) : lower;
    })
    .join(' ');
};

// A one-row answer with a few numbers reads best as headline figures, not a table.
function analyseStats(rows) {
  if (!Array.isArray(rows) || rows.length !== 1) return null;
  const row = rows[0];
  const columns = Object.keys(row);
  const metrics = columns.filter((c) => {
    const n = toNumber(row[c]);
    return n !== null && !Number.isNaN(n) && !isYear(row[c]);
  });
  if (metrics.length === 0 || metrics.length > 4) return null;
  const context = columns
    .filter((c) => !metrics.includes(c) && row[c] !== null && row[c] !== '')
    .map((c) => ({ name: prettyName(c), value: formatLabel(row[c]) }));
  return { metrics, context };
}

function StatTiles({ row, stats }) {
  const single = stats.metrics.length === 1;
  return (
    <div className={`${styles.statGrid} ${single ? styles.statGridSingle : ''}`}>
      {stats.metrics.map((m, i) => {
        const n = toNumber(row[m]);
        const compact = fmtCompact.format(n);
        const full = fmtFull.format(n);
        return (
          <div key={m} className={styles.statTile} style={{ animationDelay: `${i * 60}ms` }}>
            <div className={styles.statLabel}>{prettyName(m)}</div>
            <div className={`${styles.statValue} ${single ? styles.statValueHero : ''}`} title={full}>
              {Math.abs(n) >= 1e4 ? compact : full}
            </div>
            {Math.abs(n) >= 1e4 && <div className={styles.statFull}>{full}</div>}
          </div>
        );
      })}
      {stats.context.length > 0 && (
        <div className={styles.statContext}>
          {stats.context.map((c) => (
            <span key={c.name} className={styles.contextChip}>
              <span className={styles.contextName}>{c.name}</span> {c.value}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// Decide whether (and how) the rows can be charted.
function analyse(rows) {
  if (!Array.isArray(rows) || rows.length < 2) return null;
  const columns = Object.keys(rows[0] || {});
  if (columns.length < 2) return null;

  const numeric = columns.filter((c) => isNumericColumn(rows, c));
  let label = columns.find((c) => !numeric.includes(c));
  // All-numeric results can still be charted when the first column is a year
  if (!label && rows.every((r) => isYear(r[columns[0]]))) label = columns[0];
  if (!label) return null;

  // A column of years is a dimension, not something to plot
  const metrics = numeric.filter((c) => c !== label && !rows.every((r) => isYear(r[c])));
  if (metrics.length === 0) return null;

  // Repeated labels mean the rows need grouping first; one bar/point per row would mislead
  if (new Set(rows.map((r) => String(r[label]))).size !== rows.length) return null;

  const timeSeries = rows.length >= 3 && rows.every((r) => isDateLike(r[label]));
  return { label, metrics, kind: timeSeries ? 'line' : 'bar' };
}

const niceTicks = (min, max, count = 4) => {
  if (min === max) {
    const pad = Math.abs(min) || 1;
    min -= pad; max += pad;
  }
  const raw = (max - min) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  const lo = Math.floor(min / step) * step;
  const hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let t = lo; t <= hi + step / 2; t += step) ticks.push(Number(t.toPrecision(12)));
  return ticks;
};

function BarChart({ rows, label, metric }) {
  const shown = rows.slice(0, MAX_BARS);
  const values = shown.map((r) => toNumber(r[metric]) ?? 0);
  const min = Math.min(0, ...values);
  const max = Math.max(0, ...values);
  const range = max - min || 1;
  const zero = ((0 - min) / range) * 100;

  return (
    <div className={styles.barChart} role="img" aria-label={`Bar chart of ${metric} by ${label}`}>
      {shown.map((r, i) => {
        const v = values[i];
        const width = (Math.abs(v) / range) * 100;
        const left = v < 0 ? zero - width : zero;
        return (
          <div key={i} className={styles.barRow} title={`${formatLabel(r[label])}: ${fmtFull.format(v)}`}>
            <span className={styles.barLabel}>{formatLabel(r[label])}</span>
            <span className={styles.barTrack}>
              <span
                className={`${styles.bar} ${v < 0 ? styles.barNegative : ''}`}
                style={{ left: `${left}%`, width: `${Math.max(width, v === 0 ? 0 : 0.5)}%`, animationDelay: `${Math.min(i * 25, 400)}ms` }}
              />
            </span>
            <span className={styles.barValue}>{formatValue(toNumber(r[metric]))}</span>
          </div>
        );
      })}
      {rows.length > MAX_BARS && (
        <div className={styles.chartNote}>Showing the first {MAX_BARS} of {rows.length} rows. See the table for all rows.</div>
      )}
    </div>
  );
}

function LineChart({ rows, label, metric }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(600);
  const [hover, setHover] = useState(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(260, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const points = useMemo(
    () => rows
      .map((r) => ({ label: formatLabel(r[label]), t: timeValue(r[label]), v: toNumber(r[metric]) }))
      .filter((p) => p.v !== null)
      .sort((a, b) => a.t - b.t),
    [rows, label, metric]
  );

  if (points.length < 2) return <div className={styles.chartNote}>Not enough data to chart.</div>;

  const height = 240;
  const pad = { top: 16, right: 56, bottom: 28, left: 48 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const ticks = niceTicks(Math.min(...points.map((p) => p.v)), Math.max(...points.map((p) => p.v)));
  const yMin = ticks[0];
  const yMax = ticks[ticks.length - 1];
  const x = (i) => pad.left + (i / (points.length - 1)) * innerW;
  const y = (v) => pad.top + innerH - ((v - yMin) / (yMax - yMin || 1)) * innerH;

  const line = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.v).toFixed(1)}`).join(' ');
  const area = `${line} L${x(points.length - 1).toFixed(1)},${y(yMin)} L${x(0).toFixed(1)},${y(yMin)} Z`;
  const labelEvery = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(innerW / 90))));
  const last = points[points.length - 1];

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const i = Math.round(((px - pad.left) / innerW) * (points.length - 1));
    setHover(Math.min(points.length - 1, Math.max(0, i)));
  };

  const hp = hover !== null ? points[hover] : null;

  return (
    <div className={styles.lineWrap} ref={wrapRef}>
      <svg
        width={width}
        height={height}
        className={styles.lineSvg}
        role="img"
        aria-label={`Line chart of ${metric} over ${label}`}
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} className={styles.grid} />
            <text x={pad.left - 8} y={y(t)} className={styles.axisText} textAnchor="end" dominantBaseline="middle">
              {fmtCompact.format(t)}
            </text>
          </g>
        ))}
        {points.map((p, i) => (i % labelEvery === 0 || i === points.length - 1) && (
          <text key={i} x={x(i)} y={height - 8} className={styles.axisText} textAnchor="middle">{p.label}</text>
        ))}
        <path d={area} className={styles.area} />
        <path d={line} className={styles.line} />
        <circle cx={x(points.length - 1)} cy={y(last.v)} r="4" className={styles.dot} />
        <text x={x(points.length - 1) + 8} y={y(last.v)} className={styles.endLabel} dominantBaseline="middle">
          {formatValue(last.v)}
        </text>
        {hp && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.top} y2={pad.top + innerH} className={styles.crosshair} />
            <circle cx={x(hover)} cy={y(hp.v)} r="5" className={styles.dot} />
          </g>
        )}
      </svg>
      {hp && (
        <div
          className={styles.tooltip}
          style={{
            left: Math.min(Math.max(x(hover), 70), width - 70),
            top: Math.max(y(hp.v) - 12, 0),
          }}
        >
          <div className={styles.tooltipLabel}>{hp.label}</div>
          <div className={styles.tooltipValue}>{fmtFull.format(hp.v)}</div>
        </div>
      )}
    </div>
  );
}

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

  return (
    <div className={styles.result}>
      <div className={styles.toolbar}>
        <span className={styles.meta}>
          {data.length} {data.length === 1 ? 'row' : 'rows'}
        </span>
        <div className={styles.toolbarRight}>
          {chart && view === 'visual' && chart.metrics.length > 1 && (
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
              {['visual', 'table'].map((v) => (
                <button
                  key={v}
                  role="tab"
                  aria-selected={view === v}
                  className={`${styles.segment} ${view === v ? styles.segmentActive : ''}`}
                  onClick={() => setView(v)}
                >
                  {v === 'table' ? 'Table' : visual === 'chart' ? 'Chart' : 'Summary'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {view === 'visual' && stats ? (
        <StatTiles row={data[0]} stats={stats} />
      ) : view === 'visual' && chart ? (
        <div className={styles.chartCard} key={`${chart.kind}-${activeMetric}`}>
          <div className={styles.chartTitle}>
            {prettyName(activeMetric)} <span className={styles.chartSubtitle}>by {prettyName(chart.label)}</span>
          </div>
          {chart.kind === 'line'
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
