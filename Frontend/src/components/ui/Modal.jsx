import { useEffect, useRef, useState } from 'react';
import useKeydown from '@/hooks/useKeydown';
import { cn } from '@/lib/utils';

const FOCUSABLE =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';


export default function Modal({ onClose, label, overlayClassName, className, children }) {
  const boxRef = useRef(null);
  // The element focused when the dialog opened, read before any autoFocus inside it runs
  const [opener] = useState(() => document.activeElement);

  useKeydown((e) => e.key === 'Escape' && onClose());

  useEffect(() => {
    const box = boxRef.current;
    if (!box.contains(document.activeElement)) (box.querySelector(FOCUSABLE) || box).focus();
    return () => {
      if (opener?.isConnected) opener.focus();
    };
  }, [opener]);

  const trapTab = (e) => {
    if (e.key !== 'Tab') return;
    const items = boxRef.current.querySelectorAll(FOCUSABLE);
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div
      className={cn('fixed inset-0 z-60 flex animate-backdrop justify-center bg-overlay', overlayClassName)}
      onClick={onClose}
    >
      <div
        ref={boxRef}
        className={cn('max-w-full animate-dialog rounded-2xl bg-main shadow-xl outline-none', className)}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={trapTab}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>
  );
}
