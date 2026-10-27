import { cn } from '@/lib/utils';

// Ring colours: accent on light surfaces; inverse on the dark login button.
const TONES = {
  accent: 'border-accent-soft border-t-accent',
  inverse: 'border-line border-t-main',
};

// Spinning ring. className sets its size (and any extra layout); extra props (e.g. aria-hidden)
// go to the ring.
export default function Spinner({ tone = 'accent', className, ...props }) {
  return (
    <span
      className={cn('animate-spinner rounded-full border-2', TONES[tone], className)}
      {...props}
    />
  );
}
