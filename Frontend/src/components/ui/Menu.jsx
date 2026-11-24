import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const ITEMS = '[role="menuitem"]:not([disabled])';

// Popover menu panel (chat item options, account menu). className positions it.
// Opens with focus on the first item; Arrow keys, Home and End move between items.
// When it closes without focus going anywhere else, focus returns to the button that opened it.
export function Menu({ className, children }) {
  const menuRef = useRef(null);
  const [opener] = useState(() => document.activeElement);

  useEffect(() => {
    menuRef.current.querySelector(ITEMS)?.focus();
    return () => {
      const focusLost = !document.activeElement || document.activeElement === document.body;
      if (focusLost && opener?.isConnected) opener.focus();
    };
  }, [opener]);

  const moveFocus = (e) => {
    const items = [...menuRef.current.querySelectorAll(ITEMS)];
    if (items.length === 0) return;
    const i = items.indexOf(document.activeElement);
    const next = {
      ArrowDown: items[(i + 1) % items.length],
      ArrowUp: items[(i - 1 + items.length) % items.length],
      Home: items[0],
      End: items[items.length - 1],
    }[e.key];
    if (next) {
      e.preventDefault();
      next.focus();
    }
  };

  return (
    <div
      ref={menuRef}
      className={cn('absolute z-40 animate-menu rounded-xl border border-line bg-main p-[5px] shadow-lg', className)}
      role="menu"
      onKeyDown={moveFocus}
    >
      {children}
    </div>
  );
}

const TONES = { default: 'text-primary', danger: 'text-danger' };

// Row in a Menu. Extra props (onClick, disabled, ...) go to the button.
export function MenuItem({ tone = 'default', className, children, ...props }) {
  return (
    <button
      type="button"
      role="menuitem"
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
