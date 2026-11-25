import { useState } from 'react';

// Which of `count` items is picked (or null), with a keydown handler for reading a chart by
// keyboard: keys.next / keys.prev step, Home / End jump, Escape clears.
export default function useRovingIndex(count, keys) {
  const [active, setActive] = useState(null);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setActive(null);
      return;
    }
    const targets = {
      [keys.next]: active === null ? 0 : active + 1,
      [keys.prev]: active === null ? count - 1 : active - 1,
      Home: 0,
      End: count - 1,
    };
    if (!(e.key in targets)) return;
    e.preventDefault();
    const next = Math.max(0, Math.min(count - 1, targets[e.key]));
    setActive(next);
  };

  return [active, setActive, onKeyDown];
}
