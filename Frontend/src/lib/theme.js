export const THEME_STORAGE_KEY = 'genie-theme';

// The OS colour scheme: 'dark' or 'light'.
export const systemTheme = () =>
  window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

// Applies the saved theme (or the system preference on a first visit) before the
// first render, so dark-mode users never see a white flash. Called by MainLayout.
export const applySavedTheme = () => {
  try {
    let t = localStorage.getItem(THEME_STORAGE_KEY);
    if (t !== 'light' && t !== 'dark') {
      t = systemTheme();
    }
    document.documentElement.setAttribute('data-theme', t);
  } catch {
    // Storage blocked (private mode); keep the light default.
  }
};
