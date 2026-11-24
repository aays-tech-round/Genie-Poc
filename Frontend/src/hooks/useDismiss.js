import { useEffect, useEffectEvent } from 'react';

// Calls onClose on a click outside `ref` or on Escape, while `active` is true.
// Used by popover menus (chat item options, account menu).
export default function useDismiss(ref, active, onClose) {
  const close = useEffectEvent(() => onClose());

  useEffect(() => {
    if (!active) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) close();
    };
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [ref, active]);
}
