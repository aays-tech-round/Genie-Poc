import { cn, getInitials } from '@/lib/utils';

// Round brand-coloured badge with the user's initials. className sets size and text size.
// Extra props (e.g. aria-hidden) go to the badge.
export default function Avatar({ name, email, className, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand font-semibold tracking-[0.3px] text-main dark:text-primary',
        className
      )}
      {...props}
    >
      {getInitials(name, email)}
    </span>
  );
}
