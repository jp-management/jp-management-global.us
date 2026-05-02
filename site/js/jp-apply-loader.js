/* jp-apply-loader.js - lazy boot for jp-apply-form.js (~32 KB).
   The full apply-form bundle only matters once the user shows intent to
   apply (hover/focus on an apply CTA, click on tally.so/* link). We boot
   on first such intent, on requestIdleCallback as a backstop, and on
   click-capture as a guaranteed fallback for users who skip intent
   signals. We re-dispatch the click after load so the modal opens
   without a second tap. */
(function () {
  if (window.__jpApplyLoaderArmed) return;
  window.__jpApplyLoaderArmed = true;

  var here = (function () {
    var s = document.currentScript;
    if (s && s.src) {
      try { return new URL('.', s.src).pathname; } catch (e) {}
    }
    return '/js/';
  })();

  var loaded = false;
  var loadingPromise = null;

  function load() {
    if (loadingPromise) return loadingPromise;
    loadingPromise = new Promise(function (res) {
      var t = document.createElement('script');
      t.src = here + 'jp-apply-form.js';
      t.async = true;
      t.onload = function () { loaded = true; res(); };
      t.onerror = function () { loaded = true; res(); };
      document.head.appendChild(t);
    });
    return loadingPromise;
  }

  // Fast-path: any pointer/touch/focus on an apply trigger warms the load.
  function isTrigger(el) {
    if (!el) return false;
    if (el.closest && el.closest('a[data-jp-apply], button[data-jp-apply]')) return true;
    var a = el.closest && el.closest('a');
    if (!a) return false;
    var href = a.getAttribute('href') || '';
    return /tally\.so\/r\//i.test(href) || href === '#jp-apply' || href.indexOf('#jp-apply-form') === 0;
  }

  function onIntent(e) {
    if (loaded || loadingPromise) return;
    if (isTrigger(e.target)) load();
  }

  ['pointerover', 'focusin', 'touchstart'].forEach(function (ev) {
    document.addEventListener(ev, onIntent, { passive: true, capture: true });
  });

  // Capture-phase click handler: if the user clicks before the script has
  // booted, intercept, load, then re-dispatch so jp-apply-form's own
  // delegated click handler picks it up and opens the modal. Once loaded,
  // this handler does nothing (jp-apply-form takes over).
  document.addEventListener('click', function (e) {
    if (loaded) return;
    var a = e.target.closest && e.target.closest('a, button');
    if (!a || !isTrigger(a)) return;
    e.preventDefault();
    e.stopPropagation();
    load().then(function () {
      // Prefer the documented programmatic API jp-apply-form exposes.
      if (window.jpApply && typeof window.jpApply.open === 'function') {
        window.jpApply.open();
      } else {
        // Fallback: re-fire the click so the script's own delegated
        // listener runs.
        a.click();
      }
    });
  }, true);

  // Backstop: load eventually even if the user never hovers an apply CTA,
  // so when they finally click it the modal opens instantly.
  function backstop() {
    if (typeof window.requestIdleCallback === 'function') {
      window.requestIdleCallback(load, { timeout: 4000 });
    } else {
      setTimeout(load, 2500);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', backstop);
  } else {
    backstop();
  }
})();
