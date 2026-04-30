/* Mobile hamburger menu toggle — v7
   Self-contained overlay: X close, nav links, Apply Now, Language.
   All elements live INSIDE the overlay — no stacking context issues.
   Capture-phase click + touchend for reliability on real phones.
   MutationObserver strips IX2 inline styles from the nav.
   Language dropdown: JS click toggle with absolute positioning.
   JP compare card: kills IX2 scale/translate transforms on mobile. */
(function () {
  var ready = function (fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  };

  ready(function () {
    var burger = document.querySelector(".cmp--hd-burger");
    var nav = document.querySelector("nav.cmp--hd-nav");
    var header = document.querySelector("header.cmp--hd");
    if (!burger || !nav) return;

    // Only run on mobile
    if (window.innerWidth > 991) return;

    // Strip IX2 inline styles immediately
    nav.removeAttribute("style");

    // MutationObserver: strip IX2 inline styles whenever they get re-added
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.attributeName === "style" && !nav.classList.contains("menu-open")) {
          var s = nav.getAttribute("style");
          if (s && (s.indexOf("display") !== -1 || s.indexOf("opacity") !== -1)) {
            nav.removeAttribute("style");
          }
        }
      });
    });
    observer.observe(nav, { attributes: true, attributeFilter: ["style"] });

    // Create X close button inside the nav overlay
    var closeBtn = document.createElement("button");
    closeBtn.id = "menu-close-btn";
    closeBtn.setAttribute("aria-label", "Close menu");
    nav.appendChild(closeBtn);

    // Add JP logo to menu overlay
    var lytNavForLogo = nav.querySelector(".lyt--hd-nav");
    if (lytNavForLogo) {
      var logoDiv = document.createElement("div");
      logoDiv.id = "menu-logo";
      var logoImg = document.createElement("img");
      logoImg.src = (window.location.pathname.indexOf("/es") === 0 ? "../" : "./") + "img/abstract-logo.png";
      logoImg.alt = "JP Management";
      logoDiv.appendChild(logoImg);
      lytNavForLogo.insertBefore(logoDiv, lytNavForLogo.firstChild);
    }

    // Move language dropdown from inside nav-links to lyt--hd-nav
    // so we can reorder: Links → Apply Now → Language via CSS
    function moveLangDropdown() {
      var lytNav = nav.querySelector(".lyt--hd-nav");
      var langDd = nav.querySelector(".lyt--hd-nav-links .cmp--dd-nav-link");
      if (lytNav && langDd) {
        lytNav.appendChild(langDd);
      }
    }
    moveLangDropdown();
    // Retry after a short delay in case IX2 rebuilds the DOM
    setTimeout(moveLangDropdown, 500);
    setTimeout(moveLangDropdown, 1500);

    /* ---- Language dropdown: JS click toggle ---- */
    var langDropdown = nav.querySelector(".cmp--dd-nav-link");

    function closeLangDropdown() {
      if (langDropdown) {
        langDropdown.classList.remove("w--open");
        var toggle = langDropdown.querySelector(".w-dropdown-toggle");
        if (toggle) toggle.setAttribute("aria-expanded", "false");
      }
    }

    if (langDropdown) {
      var langToggle = langDropdown.querySelector(".w-dropdown-toggle");
      if (langToggle) {
        // Block Webflow's own dropdown handler
        langToggle.addEventListener("click", function (e) {
          e.preventDefault();
          e.stopImmediatePropagation();
          var wasOpen = langDropdown.classList.contains("w--open");
          if (wasOpen) {
            closeLangDropdown();
          } else {
            langDropdown.classList.add("w--open");
            langToggle.setAttribute("aria-expanded", "true");
          }
        }, true);

        langToggle.addEventListener("touchend", function (e) {
          e.preventDefault();
          e.stopImmediatePropagation();
          var wasOpen = langDropdown.classList.contains("w--open");
          if (wasOpen) {
            closeLangDropdown();
          } else {
            langDropdown.classList.add("w--open");
            langToggle.setAttribute("aria-expanded", "true");
          }
        }, false);
      }

      // Language links: let them navigate normally
      var langLinks = langDropdown.querySelectorAll(".w-dropdown-list a[data-lang]");
      langLinks.forEach(function (link) {
        link.addEventListener("click", function (e) {
          e.stopPropagation(); // don't close menu before navigating
          // allow default href navigation
        });
      });
    }

    var isOpen = false;

    function openMenu() {
      isOpen = true;
      nav.removeAttribute("style"); // kill any IX2 inline
      nav.classList.add("menu-open");
      burger.classList.add("is-open");
      if (header) header.classList.add("menu-open");
      document.body.classList.add("menu-is-open");
      document.body.style.overflow = "hidden";
    }

    function closeMenu() {
      isOpen = false;
      nav.classList.remove("menu-open");
      burger.classList.remove("is-open");
      if (header) header.classList.remove("menu-open");
      document.body.classList.remove("menu-is-open");
      document.body.style.overflow = "";
      closeLangDropdown(); // also close language dropdown
    }

    function toggleBurger(e) {
      e.preventDefault();
      e.stopImmediatePropagation();
      if (isOpen) closeMenu();
      else openMenu();
    }

    // Burger click (capture phase — fires before IX2)
    burger.addEventListener("click", toggleBurger, true);

    // Touch events for real phones
    var touchMoved = false;
    burger.addEventListener("touchstart", function () { touchMoved = false; }, { passive: true });
    burger.addEventListener("touchmove", function () { touchMoved = true; }, { passive: true });
    burger.addEventListener("touchend", function (e) {
      if (!touchMoved) {
        e.preventDefault();
        toggleBurger(e);
      }
    }, false);

    // X close button click
    closeBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
    });
    closeBtn.addEventListener("touchend", function (e) {
      e.preventDefault();
      e.stopPropagation();
      closeMenu();
    }, false);

    // Close when nav link tapped (but NOT language links)
    nav.addEventListener("click", function (e) {
      var link = e.target.closest("a.cmp--hd-nav-link");
      if (link && isOpen && !e.target.closest(".cmp--dd-nav-link")) {
        closeMenu();
      }
    });

    // Close on resize to desktop
    window.addEventListener("resize", function () {
      if (window.innerWidth > 991 && isOpen) closeMenu();
    });

    // Close on Escape
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && isOpen) {
        closeMenu();
        burger.focus();
      }
    });

    /* ---- Fix: JP Management compare card IX2 transform ---- */
    var compareCards = document.querySelectorAll(".cmp--compare.cmp");
    compareCards.forEach(function (card) {
      // Kill any existing transform
      card.style.setProperty("transform", "none", "important");

      // Cancel Web Animations API animations if available
      if (card.getAnimations) {
        card.getAnimations().forEach(function (anim) { anim.cancel(); });
      }

      // MutationObserver: re-strip IX2 transforms whenever they get re-added
      var cardObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          if (m.attributeName === "style") {
            var s = card.getAttribute("style");
            if (s && s.indexOf("transform") !== -1 && s.indexOf("none") === -1) {
              card.style.setProperty("transform", "none", "important");
            }
          }
        });
      });
      cardObserver.observe(card, { attributes: true, attributeFilter: ["style"] });
    });
  });
})();
