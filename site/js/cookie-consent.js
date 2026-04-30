/* Cookie Consent Manager
   GDPR-compliant: blocks GTM, Facebook Pixel, Hotjar, Matomo, Ahrefs
   until user explicitly accepts cookies.
   ---------------------------------------------------------------------- */

(function () {
  var CONSENT_KEY = "jp_cookie_consent";

  function getConsent() {
    try { return localStorage.getItem(CONSENT_KEY); } catch (e) { return null; }
  }

  function setConsent(value) {
    try { localStorage.setItem(CONSENT_KEY, value); } catch (e) { /* private browsing */ }
  }

  /* Load a script by creating a <script> tag */
  function loadScript(src, attrs) {
    var s = document.createElement("script");
    s.src = src;
    s.async = true;
    if (attrs) {
      Object.keys(attrs).forEach(function (k) { s.setAttribute(k, attrs[k]); });
    }
    document.head.appendChild(s);
  }

  /* Activate all tracking scripts that were blocked */
  function activateTracking() {
    /* GTM */
    if (window.__jp_gtm_id) {
      (function (w, d, s, l, i) {
        w[l] = w[l] || [];
        w[l].push({ "gtm.start": new Date().getTime(), event: "gtm.js" });
        var f = d.getElementsByTagName(s)[0],
          j = d.createElement(s),
          dl = l !== "dataLayer" ? "&l=" + l : "";
        j.async = true;
        j.src = "https://www.googletagmanager.com/gtm.js?id=" + i + dl;
        f.parentNode.insertBefore(j, f);
      })(window, document, "script", "dataLayer", window.__jp_gtm_id);
    }

    /* Re-enable blocked script tags */
    document.querySelectorAll('script[type="text/plain"][data-cookie-consent]').forEach(function (el) {
      var newScript = document.createElement("script");
      if (el.src) { newScript.src = el.src; newScript.async = true; }
      else { newScript.textContent = el.textContent; }
      // Copy data attributes
      Array.prototype.forEach.call(el.attributes, function (attr) {
        if (attr.name !== "type" && attr.name !== "data-cookie-consent") {
          newScript.setAttribute(attr.name, attr.value);
        }
      });
      el.parentNode.replaceChild(newScript, el);
    });
  }

  function showBanner() {
    var banner = document.getElementById("cookie-consent-banner");
    if (banner) banner.classList.add("visible");
  }

  function hideBanner() {
    var banner = document.getElementById("cookie-consent-banner");
    if (banner) banner.classList.remove("visible");
  }

  /* Public API */
  window.jpCookieConsent = {
    accept: function () {
      setConsent("accepted");
      hideBanner();
      activateTracking();
    },
    reject: function () {
      setConsent("rejected");
      hideBanner();
    }
  };

  /* On page load: check consent state */
  document.addEventListener("DOMContentLoaded", function () {
    var consent = getConsent();
    if (consent === "accepted") {
      activateTracking();
    } else if (!consent) {
      showBanner();
    }
    /* rejected = do nothing, no banner, no tracking */
  });
})();
