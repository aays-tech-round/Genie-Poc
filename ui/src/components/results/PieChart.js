"use client";

import React, { useState } from 'react';
import { fmtFull, formatLabel, formatValue, toNumber } from './resultUtils';
import styles from './PieChart.module.css';

const SIZE = 200;
const OUTER = 96;
const INNER = 62;
const C = SIZE / 2;

const fmtPct = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 });

// Donut segment from angle a0 to a1 (radians, 0 = 12 o'clock, clockwise).
const arcPath = (a0, a1) => {
  const pt = (a, r) => [C + r * Math.sin(a), C - r * Math.cos(a)];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = pt(a0, OUTER);
  const [x1, y1] = pt(a1, OUTER);
  const [x2, y2] = pt(a1, INNER);
  const [x3, y3] = pt(a0, INNER);
  return `M${x0} ${y0}A${OUTER} ${OUTER} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${INNER} ${INNER} 0 ${large} 0 ${x3} ${y3}Z`;
};

// Part-to-whole donut. Slices keep the row order Genie returned, so a colour always
// belongs to the same category; the legend names every slice with its value and share.
// Only rendered for results that pass canPie (3–6 positive, additive values).
export default function PieChart({ rows, label, metric }) {
  const [active, setActive] = useState(null);

  const slices = rows.map((r, i) => ({ name: formatLabel(r[label]), value: toNumber(r[metric]), color: `var(--series-${i + 1})` }));
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let angle = 0;
  slices.forEach((s) => {
    s.share = s.value / total;
    s.a0 = angle;
    angle += s.share * 2 * Math.PI;
    s.a1 = angle;
  });

  const focus = active !== null ? slices[active] : null;

  return (
    <div className={styles.pie}>
      <div className={styles.donutWrap}>
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className={styles.donut}
          role="img"
          aria-label={`Pie chart of ${metric} by ${label}`}
          onPointerLeave={() => setActive(null)}
        >
          {slices.map((s, i) => (
            <path
              key={i}
              d={arcPath(s.a0, s.a1)}
              fill={s.color}
              className={`${styles.slice} ${active !== null && active !== i ? styles.sliceDim : ''}`}
              style={{ animationDelay: `${i * 50}ms` }}
              onPointerEnter={() => setActive(i)}
            >
              <title>{`${s.name}: ${fmtFull.format(s.value)} (${fmtPct.format(s.share)})`}</title>
            </path>
          ))}
        </svg>
        {/* Centre readout: the total, or the hovered slice */}
        <div className={styles.center} aria-hidden="true">
          <div className={styles.centerValue}>{formatValue(focus ? focus.value : total)}</div>
          <div className={styles.centerLabel} title={focus ? focus.name : 'Total'}>
            {focus ? fmtPct.format(focus.share) : 'Total'}
          </div>
        </div>
      </div>

      <ul className={styles.legend}>
        {slices.map((s, i) => (
          <li
            key={i}
            className={`${styles.legendItem} ${active === i ? styles.legendActive : ''}`}
            tabIndex={0}
            onPointerEnter={() => setActive(i)}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
          >
            <span className={styles.swatch} style={{ background: s.color }} aria-hidden="true" />
            <span className={styles.legendName} title={s.name}>{s.name}</span>
            <span className={styles.legendValue}>{formatValue(s.value)}</span>
            <span className={styles.legendPct}>{fmtPct.format(s.share)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
