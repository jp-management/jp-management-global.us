/* Language Switcher - Dropdown Click Handlers */

document.addEventListener("DOMContentLoaded", function () {
  /* --- Live Region: announce language changes to screen readers --- */
  var liveRegion = document.createElement("div");
  liveRegion.setAttribute("aria-live", "polite");
  liveRegion.setAttribute("aria-atomic", "true");
  liveRegion.setAttribute("role", "status");
  liveRegion.style.cssText = "position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;";
  document.body.appendChild(liveRegion);

  var langNames = { en: "English", es: "Español", de: "Deutsch" };

  var langLinks = document.querySelectorAll(
    "#language-dropdown a[data-lang], #language-select a[data-lang]"
  );

  langLinks.forEach(function (link) {
    link.addEventListener("click", function (e) {
      e.preventDefault();
      var lang = this.getAttribute("data-lang");

      if (typeof i18next !== "undefined") {
        i18next.changeLanguage(lang, function (err) {
          if (err) { console.warn("i18next changeLanguage error:", err); return; }
          document.querySelectorAll("[data-i18n]").forEach(function (el) {
            // TRUST BOUNDARY: innerHTML is used intentionally here because translations
            // are loaded from local /locales/ JSON files (not user input) and may contain
            // HTML formatting such as links, <br> tags, or <strong> elements.
            el.innerHTML = i18next.t(el.getAttribute("data-i18n"));
          });
          try { localStorage.setItem("language", lang); } catch (e) { /* Private browsing may block localStorage */ }

          // Announce language change to screen readers
          liveRegion.textContent = "Language changed to " + (langNames[lang] || lang);
        });
      }
    });
  });
});
