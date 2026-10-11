/* Light/dark theme. Loaded in <head> so the right theme is applied before the first paint.
   The choice is remembered and kept in sync across tabs. */
(function () {
  var KEY = 'blog-theme';
  var root = document.documentElement;
  root.classList.add('js');

  // localStorage may throw (blocked storage); then only the system preference is used.
  var store = {
    get: function () { try { return localStorage.getItem(KEY); } catch (e) { return null; } },
    set: function (v) { try { localStorage.setItem(KEY, v); } catch (e) { /* no persistence */ } }
  };
  var session = null;
  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : { matches: false };
  function apply() { root.dataset.theme = session || store.get() || (mq.matches ? 'dark' : 'light'); }
  apply();
  if (mq.addEventListener) mq.addEventListener('change', apply);
  addEventListener('storage', function (e) { if (e.key === KEY) { session = e.newValue; apply(); } });

  var SUN = '<svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
  var MOON = '<svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11z"/></svg>';

  window.Theme = {
    get: function () { return root.dataset.theme; },
    toggle: function () {
      session = root.dataset.theme === 'dark' ? 'light' : 'dark';
      store.set(session);
      apply();
    }
  };

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.innerHTML = MOON + SUN;
      b.title = 'Light / dark mode';
      b.setAttribute('aria-label', 'Toggle light and dark mode');
      b.addEventListener('click', Theme.toggle);
    });
  });
})();
