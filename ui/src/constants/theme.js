export const THEME_STORAGE_KEY = 'genie-theme';

// Applies the saved theme (or the system preference on a first visit) before the
// first paint, so dark-mode users never see a white flash. Inlined by app/(main)/layout.js.
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){}})();`;
