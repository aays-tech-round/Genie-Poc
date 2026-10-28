import { ChevronRight } from 'lucide-react';
import Spinner from '@/components/ui/Spinner';
import { cn, formatCode } from '@/lib/utils';

// Genie's status codes in the order it reported them, as one wrapping row:
// "Fetching metadata › Asking AI › Executing query". While `live`, the latest step is
// highlighted with a spinner. A code can recur (Asking AI before and after the query
// runs), which reads naturally in a left-to-right flow.
export default function StepFlow({ steps, live }) {
  return (
    <ol className="flex flex-wrap items-center gap-y-1.5 text-[0.82rem] leading-6">
      {steps.map((s, i) => {
        const current = live && i === steps.length - 1;
        return (
          <li
            key={`${s}-${i}`}
            className="inline-flex animate-[riseIn_0.3s_var(--ease-smooth)_both] items-center"
            aria-current={current ? 'step' : undefined}
          >
            {i > 0 && <ChevronRight size={13} className="mx-1 shrink-0 text-secondary opacity-60" aria-hidden="true" />}
            <span
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap',
                current ? 'rounded-full bg-accent-soft px-2.5 font-medium text-primary' : 'text-secondary'
              )}
            >
              {current && <Spinner className="size-3" aria-hidden="true" />}
              {formatCode(s)}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
