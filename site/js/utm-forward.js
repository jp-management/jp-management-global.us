/**
 * utm-forward.js v2 — Persist UTM params across pages & forward to Tally
 *
 * 1. On landing: reads utm_* from URL, stores in sessionStorage
 * 2. On every page: reads from sessionStorage (survives navigation)
 * 3. Appends UTMs to ALL internal links + ALL tally.so links
 * 4. MutationObserver catches dynamically added/changed links
 */
(function () {
  "use strict";

  var STORAGE_KEY = "jp_utm_params";

  // --- Read UTMs from current URL ---
  var urlParams = new URLSearchParams(window.location.search);
  var freshUtms = new URLSearchParams();
  urlParams.forEach(function (v, k) {
    if (k.toLowerCase().indexOf("utm_") === 0) freshUtms.append(k, v);
  });

  // --- Persist: if URL has UTMs, save them (overwrite old). Otherwise read stored. ---
  var utmString = "";
  if (freshUtms.toString()) {
    utmString = freshUtms.toString();
    try { sessionStorage.setItem(STORAGE_KEY, utmString); } catch (e) {}
  } else {
    try { utmString = sessionStorage.getItem(STORAGE_KEY) || ""; } catch (e) {}
  }

  if (!utmString) return; // nothing to forward

  // --- Helpers ---
  var ownHost = window.location.hostname; // jp-management-global.com

  function isInternalHref(href) {
    if (!href) return false;
    if (href.indexOf("javascript:") === 0 || href.indexOf("#") === 0 || href.indexOf("mailto:") === 0) return false;
    // Relative links are internal
    if (href.indexOf("://") === -1) return true;
    // Absolute links on same domain
    try { return new URL(href).hostname === ownHost; } catch (e) { return false; }
  }

  function isTallyHref(href) {
    return href && href.indexOf("tally.so") !== -1;
  }

  function appendUtm(href) {
    if (!href || href.indexOf("utm_") !== -1) return href; // already has UTMs
    var sep = href.indexOf("?") === -1 ? "?" : "&";
    return href + sep + utmString;
  }

  function updateLink(link) {
    var href = link.getAttribute("href");
    if (isInternalHref(href) || isTallyHref(href)) {
      var newHref = appendUtm(href);
      if (newHref !== href) link.setAttribute("href", newHref);
    }
  }

  function updateAllLinks(root) {
    var links = (root || document).querySelectorAll("a[href]");
    links.forEach(updateLink);
  }

  // --- Expose helper globally so other scripts (translate.js) can use it ---
  window.__jpUtmAppend = appendUtm;
  window.__jpUtmString = utmString;

  // --- Update on DOM ready ---
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { updateAllLinks(); });
  } else {
    updateAllLinks();
  }

  // --- MutationObserver for dynamic changes ---
  if (typeof MutationObserver !== "undefined") {
    var startObserver = function () {
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          m.addedNodes.forEach(function (node) {
            if (node.nodeType === 1) {
              if (node.tagName === "A") updateLink(node);
              if (node.querySelectorAll) {
                node.querySelectorAll("a[href]").forEach(updateLink);
              }
            }
          });
          if (m.type === "attributes" && m.attributeName === "href" && m.target.tagName === "A") {
            updateLink(m.target);
          }
        });
      });
      observer.observe(document.body, {
        childList: true, subtree: true,
        attributes: true, attributeFilter: ["href"]
      });
    };
    if (document.body) startObserver();
    else document.addEventListener("DOMContentLoaded", startObserver);
  }
})();
