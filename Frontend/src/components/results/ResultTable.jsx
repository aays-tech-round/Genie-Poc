import { useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { isNumericColumn, isYear, toNumber, formatCell, prettyName } from './resultUtils';
import { cn } from '@/lib/utils';

// The full query result as a table. Click a column header to sort by it (highest / Z first,
// then lowest / A first, then back to Genie's order). Number columns are right-aligned with
// tabular figures so digits line up; the header stays visible while the body scrolls.

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
const cellX = 'px-4 max-sm:px-3';
const bodyCell = `${cellX} h-10 border-b border-line/70 whitespace-nowrap max-sm:h-9`;
const headCell = 'sticky top-0 z-1 h-9 border-b border-line bg-soft';

export default function ResultTable({ data }) {
  const [sort, setSort] = useState(null); // { key, dir: 'desc' | 'asc' }

  const headers = Object.keys(data[0]);
  const numeric = new Set(
    headers.filter((h) => isNumericColumn(data, h) && !data.every((r) => r[h] == null || isYear(r[h])))
  );

  const rows = data.map((row, i) => ({ row, i }));
  if (sort) {
    const { key, dir } = sort;
    const sign = dir === 'asc' ? 1 : -1;
    const isNum = numeric.has(key);
    rows.sort((a, b) => {
      const x = a.row[key];
      const y = b.row[key];
      if (x == null || x === '') return 1; // blanks always last
      if (y == null || y === '') return -1;
      return sign * (isNum ? toNumber(x) - toNumber(y) : collator.compare(String(x), String(y)));
    });
  }

  const cycleSort = (key) =>
    setSort((s) => (s?.key !== key ? { key, dir: 'desc' } : s.dir === 'desc' ? { key, dir: 'asc' } : null));

  return (
    <div className="max-h-115 animate-[fadeOnly_0.25s_ease_both] overflow-auto rounded-xl border border-line bg-main shadow-sm scrollbar-thin">
      <table className="w-full border-separate border-spacing-0 text-left text-[0.84rem]">
        <thead>
          <tr>
            <th scope="col" className={cn(headCell, 'w-12 pr-0 pl-4 text-left text-[0.68rem] font-semibold tracking-[0.06em] text-secondary/80 max-sm:pl-3')}>
              <span className="sr-only">Row number</span>
              <span aria-hidden="true">#</span>
            </th>
            {headers.map((h) => {
              const isNum = numeric.has(h);
              const active = sort?.key === h;
              const Icon = !active ? ArrowUpDown : sort.dir === 'desc' ? ArrowDown : ArrowUp;
              return (
                <th
                  key={h}
                  scope="col"
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  className={cn(headCell, 'p-0')}
                >
                  <button
                    type="button"
                    title={`${h} · click to sort`}
                    className={cn(
                      cellX,
                      'group flex h-9 w-full items-center gap-1 text-[0.68rem] font-semibold tracking-[0.06em] whitespace-nowrap uppercase transition-colors hover:text-primary focus-visible:bg-line/60 focus-visible:outline-none',
                      isNum ? 'justify-end' : 'justify-start',
                      active ? 'text-primary' : 'text-secondary'
                    )}
                    onClick={() => cycleSort(h)}
                  >
                    {isNum && (
                      <Icon
                        className={cn('size-3 shrink-0 transition-opacity', active ? 'opacity-100' : 'opacity-0 group-hover:opacity-50 group-focus-visible:opacity-50')}
                        aria-hidden="true"
                      />
                    )}
                    <span>{prettyName(h)}</span>
                    {!isNum && (
                      <Icon
                        className={cn('size-3 shrink-0 transition-opacity', active ? 'opacity-100' : 'opacity-0 group-hover:opacity-50 group-focus-visible:opacity-50')}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ row, i }, pos) => (
            <tr key={i} className="transition-colors even:bg-soft/40 hover:bg-accent-soft/50 [&:last-child>td]:border-b-0">
              <td className={cn(bodyCell, 'w-12 pr-0 text-[0.72rem] text-secondary/80 tabular-nums')}>{pos + 1}</td>
              {headers.map((h, c) => {
                const v = row[h];
                const isNum = numeric.has(h);
                const blank = v === null || v === undefined || v === '';
                return (
                  <td
                    key={h}
                    className={cn(
                      bodyCell,
                      isNum ? 'text-right tabular-nums' : 'max-w-80 truncate',
                      c === 0 && !isNum ? 'font-medium text-primary' : 'text-primary/85',
                      sort?.key === h && 'text-primary'
                    )}
                    title={!isNum && !blank ? String(v) : undefined}
                  >
                    {blank ? <span className="text-secondary/70">—</span> : formatCell(v, isNum)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
