import { useEffect, useState } from 'react';

// The content width (px) of the element in `ref`, kept up to date as it resizes.
// Returns `initial` until the first measurement, and never less than `min`.
export default function useElementWidth(ref, initial = 600, min = 260) {
  const [width, setWidth] = useState(initial);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(min, entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, min]);

  return width;
}
