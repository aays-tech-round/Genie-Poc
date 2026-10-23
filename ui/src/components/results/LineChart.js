"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { toNumber, timeValue, fmtFull, fmtCompact, formatValue, formatLabel, niceTicks } from './resultUtils';
import styles from './ResultView.module.css';

// Time series with a hover crosshair; resizes with its container.
export default function LineChart({ rows, label, metric }) {
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
