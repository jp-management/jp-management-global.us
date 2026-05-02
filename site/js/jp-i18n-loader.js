/* jp-i18n-loader.js - lazy boot for the i18next translation stack.
   Saves ~70 KB of JS on pages that have no [data-i18n] elements (blog
   posts, etc.) and defers the cost on pages that do have them until
   after first paint via requestIdleCallback. */
(function () {
  if (window.__jpI18nLoaded) return;
  window.__jpI18nLoaded = true;

  // Resolve the base path relative to where this script lives so /es/ pages
  // pick up ../js/ correctly without hard-coding paths in HTML.
  var here = (function () {
    var s = document.currentScript;
    if (s && s.src) {
      try { return new URL('.', s.src).pathname; } catch (e) {}
    }
    return '/js/';
  })();

  function bootIfNeeded() {
    if (!document.querySelector('[data-i18n]')) return;
    function add(src) {
      return new Promise(function (res, rej) {
        var t = document.createElement('script');
        t.src = src;
        t.async = false; // preserve order
        t.onload = res;
        t.onerror = rej;
        document.head.appendChild(t);
      });
    }
    add(here + 'i18next.min.js')
      .then(function () { return add(here + 'i18nextHttpBackend.min.js'); })
      .then(function () { return add(here + 'translate.js?v=8'); })
      .catch(function () { /* ignore */ });
  }

  function arm() {
    // Idle is the primary trigger; first user interaction is a fast-path.
    var fired = false;
    function go() { if (fired) return; fired = true; bootIfNeeded(); }
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(go, { timeout: 1500 });
    } else {
      setTimeout(go, 800);
    }
    ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) {
      window.addEventListener(ev, go, { once: true, passive: true });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arm);
  } else {
    arm();
  }
})();
