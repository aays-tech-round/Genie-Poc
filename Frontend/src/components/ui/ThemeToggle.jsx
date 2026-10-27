import { useEffect, useState } from 'react';
import { THEME_STORAGE_KEY } from '@/constants/theme';
import { Moon, Sun } from 'lucide-react';
import styles from './ThemeToggle.module.css';

const systemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

const readSaved = () => {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY);
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
};

const applyTheme = (theme, animate) => {
  const root = document.documentElement;
  if (animate) {
    root.classList.add('theme-switching');
    window.clearTimeout(applyTheme.timer);
    applyTheme.timer = window.setTimeout(() => root.classList.remove('theme-switching'), 400);
  }
  root.setAttribute('data-theme', theme);
};

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
      className={`${styles.toggle} ${className}`}
      onClick={toggle}
      aria-label={label}
      title={label}
    >
      <span className={`${styles.icon} ${isDark ? styles.hidden : ''}`}><Moon size={18} /></span>
      <span className={`${styles.icon} ${isDark ? '' : styles.hidden}`}><Sun size={18} /></span>
    </button>
  );
}
