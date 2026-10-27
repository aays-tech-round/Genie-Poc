import { useEffect, useState } from 'react';
import { THEME_STORAGE_KEY, systemTheme } from '@/constants/theme';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/utils';
import { iconButton } from './classes';

const readSaved = () => {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY);
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
};

// Pending removal of the .theme-switching class (one at a time across toggles)
let switchingTimer;

const applyTheme = (theme, animate) => {
  const root = document.documentElement;
  if (animate) {
    root.classList.add('theme-switching');
    window.clearTimeout(switchingTimer);
    switchingTimer = window.setTimeout(() => root.classList.remove('theme-switching'), 400);
  }
  root.setAttribute('data-theme', theme);
};

const swapIcon =
  'absolute inset-0 flex items-center justify-center transition-[opacity,rotate,scale] duration-[0.3s,0.4s,0.4s] ease-smooth';
const hiddenIcon = 'opacity-0 -rotate-90 scale-60';

export default function ThemeToggle({ className = '' }) {
  const [theme, setTheme] = useState(
    () => document.documentElement.getAttribute('data-theme') || systemTheme()
  );

  useEffect(() => {
    // Until the user picks a theme, follow the OS setting live
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (readSaved()) return;
      const next = systemTheme();
      applyTheme(next, true);
      setTheme(next);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next, true);
    setTheme(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode etc.: the choice just won't persist
    }
  };

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light theme' : 'Switch to dark theme';

  return (
    <button
      type="button"
      className={cn(iconButton, 'relative', className)}
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      {/* Sun and moon swap with a quarter turn */}
      <span className={cn(swapIcon, isDark && hiddenIcon)}><Moon size={18} /></span>
      <span className={cn(swapIcon, !isDark && hiddenIcon)}><Sun size={18} /></span>
    </button>
  );
}
