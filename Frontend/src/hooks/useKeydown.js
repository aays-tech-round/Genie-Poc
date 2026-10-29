import { useEffect, useEffectEvent } from 'react';

// Calls onKeyDown for every keydown on the document while `active` is true.
// The handler always sees the latest props/state, without re-subscribing.
export default function useKeydown(onKeyDown, active = true) {
  const handle = useEffectEvent((e) => onKeyDown(e));

  useEffect(() => {
    if (!active) return;
    const listener = (e) => handle(e);
    document.addEventListener('keydown', listener);
    return () => document.removeEventListener('keydown', listener);
  }, [active]);
}
