import { useEffect } from 'react';

// Calls onClose on a click outside `ref` or on Escape, while `active` is true.
// Used by popover menus (chat item options, account menu).
export default function useDismiss(ref, active, onClose) {
  useEffect(() => {
    if (!active) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, active, onClose]);
}
