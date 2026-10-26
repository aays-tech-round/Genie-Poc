import { MAX_BARS, toNumber, fmtFull, formatValue, formatLabel } from './resultUtils';
import styles from './ResultView.module.css';

// Horizontal bars, one per row (capped at MAX_BARS).
export default function BarChart({ rows, label, metric }) {
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
