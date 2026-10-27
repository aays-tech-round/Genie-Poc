import { cn } from '@/lib/utils';

const DELAYS_S = [0, 0.15, 0.3];

// Three staggered dots meaning "working on it". className lays out the row;
// dotClassName sets each dot's size and animation; extra props (e.g. aria-hidden) go to the row.
export default function TypingDots({ className, dotClassName, ...props }) {
  return (
    <span className={className} {...props}>
      {DELAYS_S.map((delay) => (
        <span
          key={delay}
          className={cn('rounded-full bg-accent', dotClassName)}
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </span>
  );
}
