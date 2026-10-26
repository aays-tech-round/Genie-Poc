export const THEME_STORAGE_KEY = 'genie-theme';

// Applies the saved theme (or the system preference on a first visit) before the
// first render, so dark-mode users never see a white flash. Called by MainLayout.
export const applySavedTheme = () => {
  try {
    let t = localStorage.getItem(THEME_STORAGE_KEY);
    if (t !== 'light' && t !== 'dark') {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', t);
  } catch {
    // Storage blocked (private mode); keep the light default.
  }
};
