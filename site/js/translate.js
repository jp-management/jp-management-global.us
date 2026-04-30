/* Language Detection & i18next Translation System */

(function () {
  // Detect language from URL path: /es/... = Spanish, everything else = English
  // Also handles local file:// paths where /es/ may appear deeper in the path
  var fullPath = window.location.pathname;
  var currentLang = fullPath.includes("/es/") || fullPath.endsWith("/es") ? "es" : "en";

  try { localStorage.setItem("language", currentLang); } catch (e) { /* Private browsing may block localStorage */ }

  // Determine which translation file to load based on current page
  var page = window.location.pathname;
  var fileName = currentLang === "es" ? "empezar.json" : "start.json";

  if (page.includes("about-us")) fileName = "about.json";
  else if (page.includes("services")) fileName = "services.json";
  else if (page.includes("case-studies") || page.includes("casestudies")) fileName = "casestudies.json";
  else if (page.includes("contact") || page.includes("contacto")) fileName = "contact.json";
  else if (page.includes("imprint")) fileName = "imprint.json";

  // Calculate base path: "../" for /es/ pages, "./" for root pages
  var basePath = currentLang === "es" ? "../" : "./";

  // Init i18next
  i18next
    .use(i18nextHttpBackend)
    .init(
      {
        lng: currentLang,
        fallbackLng: "en",
        backend: {
          loadPath: basePath + "locales/{{lng}}/" + fileName + "?v=6"
        }
      },
      function (err) {
        if (err) { console.warn("i18next init warning:", err); }
        // Always apply translations — the primary language may have loaded
        // even if the fallback language file returned a 404
        updateContent();
        updateApplyButtons(currentLang);
        updateMainVideo(currentLang);
      }
    );

  function updateContent() {
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      // TRUST BOUNDARY: innerHTML is used intentionally here because translations
      // are loaded from local /locales/ JSON files (not user input) and may contain
      // HTML formatting such as links, <br> tags, or <strong> elements.
      el.innerHTML = i18next.t(el.getAttribute("data-i18n"));
    });
  }

  function updateApplyButtons(lang) {
    var links = {
      en: "https://tally.so/r/npEWvV",
      es: "https://tally.so/r/nPxXk5"
    };
    var utmStr = "";
    try { utmStr = sessionStorage.getItem("jp_utm_params") || ""; } catch(e) {}
    document.querySelectorAll(".cmp--btn.cmp.w-inline-block").forEach(function (btn) {
      var href = links[lang];
      if (utmStr) href += "?" + utmStr;
      btn.setAttribute("href", href);
    });
  }

  function updateMainVideo(lang) {
    var videos = {
      en: "https://jp-management-global.com/videos/introe.mp4",
      es: "https://jp-management-global.com/videos/spanish-version.mp4"
    };
    var posters = {
      en: "https://jp-management-global.com/videos/introe-poster.jpg",
      es: "https://jp-management-global.com/videos/spanish-version-poster.jpg"
    };
    var videoEl = document.getElementById("main1");
    if (videoEl) {
      videoEl.setAttribute("poster", posters[lang]);
      var source = videoEl.querySelector("source");
      if (source) {
        source.src = videos[lang] + "?v=" + Date.now();
        videoEl.load();
        videoEl.play();
      }
    }
  }

})();
