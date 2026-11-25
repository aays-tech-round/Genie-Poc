import { cn } from '@/lib/utils';

const TONES = {
  accent: 'border-accent-soft border-t-accent',
  inverse: 'border-line border-t-main',
};


export default function Spinner({ tone = 'accent', className, ...props }) {
  return (
    <span
      className={cn('animate-spinner rounded-full border-2', TONES[tone], className)}
      {...props}
    />
  );
}
