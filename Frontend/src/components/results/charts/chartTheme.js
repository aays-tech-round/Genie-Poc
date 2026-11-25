
export const axisTick = { fill: 'var(--secondary)', fontSize: 11 };
export const gridStroke = 'var(--line)';
export const barCursor = { fill: 'var(--secondary)', fillOpacity: 0.08, stroke: 'none' };
export const lineCursor = { stroke: 'var(--secondary)', strokeWidth: 1 };
// Recharts' default draw-in is 1.5 s; this keeps it short and calm.
export const animation = { animationDuration: 600, animationEasing: 'ease-out' };

export const seriesKey = (slot) => `m${slot}`;

export const niceTicks = (min, max, count = 4) => {
  let lo = Math.min(0, min);
  let hi = Math.max(0, max);
  if (lo === hi) hi = lo + 1;
  const raw = (hi - lo) / count;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw);
  lo = Math.floor(lo / step) * step;
  hi = Math.ceil(hi / step) * step;
  const ticks = [];
  for (let t = lo; t <= hi + step / 2; t += step) ticks.push(Number(t.toPrecision(12)));
  return ticks;
};

export const truncate = (text, maxChars) => {
  const s = String(text);
  return s.length <= maxChars ? s : `${s.slice(0, Math.max(1, maxChars - 1))}…`;
};
