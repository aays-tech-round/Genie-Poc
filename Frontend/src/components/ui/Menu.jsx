import { cn } from '@/lib/utils';

// Popover menu panel (chat item options, account menu). className positions it.
export function Menu({ className, children }) {
  return (
    <div
      className={cn('absolute z-40 animate-menu rounded-xl border border-line bg-main p-[5px] shadow-lg', className)}
      role="menu"
    >
      {children}
    </div>
  );
}

const TONES = { default: 'text-primary', danger: 'text-danger' };

// Row in a Menu. Extra props (onClick, role, ...) go to the button.
export function MenuItem({ tone = 'default', className, children, ...props }) {
  return (
    <button
      className={cn(
        'flex w-full items-center gap-[0.6rem] rounded-lg px-[0.6rem] py-2 text-left text-sm transition-colors duration-[120ms] hover:bg-line',
        TONES[tone],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
