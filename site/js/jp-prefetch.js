/* jp-prefetch.js — instant.page-style prefetch for internal links.
   Listens for hover / focus / touchstart on same-origin <a> tags and
   inserts <link rel="prefetch"> so the next page is warm in cache.
   ~1 KB. Safe everywhere: graceful no-op if browser lacks support. */
(function () {
  if (typeof window === 'undefined') return;

  // Honour data-saver / slow connections.
  var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn && (conn.saveData || /2g/.test(conn.effectiveType || ''))) return;

  // Feature detect: <link rel="prefetch"> support.
  var supports = (function () {
    try {
      var l = document.createElement('link');
      return l.relList && l.relList.supports && l.relList.supports('prefetch');
    } catch (e) { return false; }
  })();
  if (!supports) return;

  var prefetched = Object.create(null);
  var origin = location.origin;
  var HOVER_DELAY = 65; // ms - filter out drive-by mouse moves

  function eligible(a) {
    if (!a || !a.href) return null;
    if (a.target === '_blank') return null;
    if (a.hasAttribute('download')) return null;
    if (a.dataset && a.dataset.noPrefetch === 'true') return null;
    var url;
    try { url = new URL(a.href); } catch (e) { return null; }
    if (url.origin !== origin) return null;
    if (url.pathname === location.pathname && url.search === location.search) return null;
    // Strip hash for cache key - same page with #anchor doesn't need prefetch.
    var key = url.origin + url.pathname + url.search;
    if (prefetched[key]) return null;
    return key;
  }

  function prefetch(href) {
    prefetched[href] = 1;
    var link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    link.as = 'document';
    document.head.appendChild(link);
  }

  var hoverTimer = null;

  function onHoverStart(e) {
    var a = e.target.closest && e.target.closest('a');
    var key = eligible(a);
    if (!key) return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(function () { prefetch(key); }, HOVER_DELAY);
  }

  function onHoverEnd() {
    clearTimeout(hoverTimer);
  }

  function onTouch(e) {
    var a = e.target.closest && e.target.closest('a');
    var key = eligible(a);
    if (key) prefetch(key);
  }

  document.addEventListener('mouseover', onHoverStart, { passive: true, capture: true });
  document.addEventListener('mouseout', onHoverEnd, { passive: true, capture: true });
  document.addEventListener('focusin', onHoverStart, { passive: true, capture: true });
  document.addEventListener('touchstart', onTouch, { passive: true, capture: true });
})();
