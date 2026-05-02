// JP Management - Meta Pixel
// ================================
// CHANGE THE PIXEL ID BELOW TO UPDATE ALL PAGES AUTOMATICALLY
// ================================
//
// Strategy: install the fbq() stub + queue immediately so PageView / custom
// events fire instantly, then load the real fbevents.js (~97 KB) async right
// after first paint via requestIdleCallback (typically <300 ms post-paint),
// with interaction triggers as fast-paths and a 600 ms safety timeout. This
// keeps Meta Ads attribution reliable even for short visits, while not
// blocking initial paint or LCP.
(function () {
  var PIXEL_ID = "2077027299860037";

  // Standard fbq stub - identical to Meta's snippet, just without the loader.
  // n.queue is the buffer; the real fbevents.js will drain it on load.
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
  })(window, document);

  fbq("init", PIXEL_ID);
  fbq("track", "PageView");

  var loaded = false;
  function loadPixel() {
    if (loaded) return;
    loaded = true;
    var t = document.createElement("script");
    t.async = true;
    t.src = "https://connect.facebook.net/en_US/fbevents.js";
    var s = document.getElementsByTagName("script")[0];
    s.parentNode.insertBefore(t, s);
  }

  var EVENTS = ["scroll", "pointerdown", "keydown", "touchstart"];
  function arm() {
    EVENTS.forEach(function (ev) {
      window.addEventListener(ev, loadPixel, { once: true, passive: true, capture: true });
    });
    // Idle-callback fires the moment the browser has spare frames after first
    // paint - typically 50-300 ms. Falls back to a 600 ms safety setTimeout so
    // even instant bouncers get tracked, while still being far enough out not
    // to compete with LCP.
    if (typeof window.requestIdleCallback === "function") {
      window.requestIdleCallback(loadPixel, { timeout: 600 });
    } else {
      setTimeout(loadPixel, 600);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", arm, { once: true });
  } else {
    arm();
  }
})();
