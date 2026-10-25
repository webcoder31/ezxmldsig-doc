/*
 * The theme button: automatic (the theme of the system), dark, light, in
 * turn. The choice is kept in this browser; the script of the head of each
 * page applies it before the first paint.
 */
(function () {
  'use strict';

  const THEMES = ['auto', 'dark', 'light'];
  const LABELS = { auto: 'automatic', dark: 'dark', light: 'light' };
  const KEY = 'ezxmldsig-doc-theme';

  function readStoredTheme() {
    try {
      const value = localStorage.getItem(KEY);
      return THEMES.indexOf(value) === -1 ? 'auto' : value;
    } catch (e) {
      return 'auto';
    }
  }

  function applyTheme(button, theme) {
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
    button.dataset.choice = theme;
    button.setAttribute('aria-label', 'Color theme: ' + LABELS[theme] + '. Change it.');
    button.title = 'Theme: ' + LABELS[theme];
  }

  document.addEventListener('DOMContentLoaded', function () {
    const button = document.getElementById('theme-toggle');
    if (!button) return;
    let theme = readStoredTheme();
    applyTheme(button, theme);
    button.addEventListener('click', function () {
      theme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
      applyTheme(button, theme);
      try { localStorage.setItem(KEY, theme); } catch (e) { /* not kept */ }
    });
  });
})();
