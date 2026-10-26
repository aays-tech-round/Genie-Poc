import { toNumber, fmtFull, fmtCompact, prettyName } from './resultUtils';
import styles from './ResultView.module.css';

// Headline figures for a one-row answer.
export default function StatTiles({ row, stats }) {
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
