// Pure helpers for Genie query results (arrays of {column: value} rows):
// number parsing / formatting, column naming, and deciding how to visualise a result.

export const MAX_BARS = 25;

export const toNumber = (v) => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : NaN;
  const n = Number(String(v).trim());
  return Number.isFinite(n) ? n : NaN;
};

export const isNumericColumn = (rows, col) => {
  let seen = 0;
  for (const r of rows) {
    const n = toNumber(r[col]);
    if (Number.isNaN(n)) return false;
    if (n !== null) seen++;
  }
  return seen > 0;
};

export const isYear = (v) => /^(19|20)\d{2}$/.test(String(v ?? '').trim());
export const isDateLike = (v) => {
  const s = String(v ?? '').trim();
  return isYear(s) || (/^\d{4}-\d{2}(-\d{2})?([T ].*)?$/.test(s) && !Number.isNaN(Date.parse(s)));
};
export const timeValue = (v) => (isYear(v) ? Number(v) * 1e10 : Date.parse(String(v).trim()));

export const fmtFull = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 });
export const fmtCompact = new Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 });
export const formatValue = (n) => (n === null ? '—' : Math.abs(n) >= 1e6 ? fmtCompact.format(n) : fmtFull.format(n));

// Genie returns numbers as strings, sometimes in scientific notation ("1.37482663E8").
// Year columns stay as-is; other numbers get thousands separators.
export const formatCell = (v, numeric) => {
  if (!numeric) return String(v);
  const n = toNumber(v);
  return n === null || Number.isNaN(n) ? String(v) : fmtFull.format(n);
};

export const formatLabel = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  const s = String(v);
  // Trim midnight timestamps down to the date
  return s.replace(/^(\d{4}-\d{2}-\d{2})[T ]00:00:00(\.0+)?Z?$/, '$1');
};

// "ytd_revenue_2025" -> "YTD revenue 2025", "part.code" -> "Part code"
const ACRONYMS = new Set(['ytd', 'mtd', 'qtd', 'yoy', 'mom', 'usa', 'us', 'uk', 'id', 'kpi', 'pct']);
export const prettyName = (col) => {
  const words = String(col).replace(/([a-z])([A-Z])/g, '$1 $2').split(/[\s_.]+/).filter(Boolean);
  return words
    .map((w, i) => {
      const lower = w.toLowerCase();
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      return i === 0 ? lower[0].toUpperCase() + lower.slice(1) : lower;
    })
    .join(' ');
};

// A one-row answer with a few numbers reads best as headline figures, not a table.
export function analyseStats(rows) {
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

// Decide whether (and how) the rows can be charted.
export function analyse(rows) {
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

// Pie / donut is offered for part-to-whole only: 3–6 slices (two read better as numbers,
// more than six are hard to tell apart), every value positive, and a metric whose values
// add up to a meaningful total. Averages, rates and percentages don't, so they stay bars.
export const PIE_MAX_SLICES = 6;
const NON_ADDITIVE = new Set([
  'avg', 'average', 'mean', 'median', 'rate', 'ratio', 'pct', 'percent', 'percentage',
  'share', 'per', 'min', 'max', 'minimum', 'maximum', 'score', 'index', 'rank',
]);

export function canPie(rows, metric) {
  if (!Array.isArray(rows) || rows.length < 3 || rows.length > PIE_MAX_SLICES) return false;
  const words = String(metric).replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[\s_.\-]+/);
  if (words.some((w) => NON_ADDITIVE.has(w))) return false;
  return rows.every((r) => {
    const n = toNumber(r[metric]);
    return n !== null && !Number.isNaN(n) && n > 0;
  });
}

export const niceTicks = (min, max, count = 4) => {
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
