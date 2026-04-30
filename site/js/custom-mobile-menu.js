/* Mobile Menu Navigation Handler */

document.addEventListener("DOMContentLoaded", function () {
  function closeMobileMenu() {
    var menuButton = document.querySelector(".w-nav-button");
    var navMenu = document.querySelector(".w-nav-menu");
    if (navMenu && navMenu.classList.contains("w--open") && menuButton) {
      menuButton.click();
      menuButton.setAttribute("aria-expanded", "false");
      return true;
    }
    return false;
  }

  /* --- Keyboard Accessibility: Escape closes mobile menu --- */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      // Close mobile menu if open
      var navMenu = document.querySelector(".w-nav-menu");
      if (navMenu && navMenu.classList.contains("w--open")) {
        closeMobileMenu();
        var menuButton = document.querySelector(".w-nav-button");
        if (menuButton) menuButton.focus();
      }
      // Close any open language dropdown
      var openDropdown = document.querySelector(".cmp--dd-nav-link .w-dropdown-list[style*='display: block']");
      if (openDropdown) {
        openDropdown.style.display = "";
        var toggle = openDropdown.closest(".w-dropdown").querySelector(".w-dropdown-toggle");
        if (toggle) {
          toggle.setAttribute("aria-expanded", "false");
          toggle.focus();
        }
      }
    }
  });

  function handleNavigation(e) {
    // Skip language switcher links — let Webflow's dropdown handle them
    if (this.hasAttribute("data-lang") || this.closest("#language-switcher")) return;

    e.preventDefault();
    var targetId = this.getAttribute("data-target");
    if (!targetId) return;

    var targetSection = null;

    if (targetId === "about") {
      targetSection = document.querySelector(".section-about");
    } else if (targetId === "meet") {
      targetSection = document.querySelector(".section-testimonials");
    } else if (targetId === "chat") {
      targetSection = document.querySelector(".section-casestudies");
    }

    closeMobileMenu();

    // 100ms delay allows the mobile menu close animation to complete
    // before scrolling, preventing layout shift during smooth scroll.
    setTimeout(function () {
      if (targetSection) {
        targetSection.scrollIntoView({ behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 100);
  }

  // Wait for Webflow scripts, then attach handlers.
  // Max 50 retries (5 seconds at 100ms) to avoid running indefinitely if Webflow never loads.
  var webflowRetries = 0;
  var maxWebflowRetries = 50;
  var checkWebflow = setInterval(function () {
    webflowRetries++;
    if (webflowRetries >= maxWebflowRetries) {
      clearInterval(checkWebflow);
      console.warn("custom-mobile-menu: Webflow not detected after " + maxWebflowRetries + " retries. Aborting.");
      return;
    }
    if (window.Webflow && window.Webflow.require) {
      clearInterval(checkWebflow);

      /* --- ARIA: Set up burger menu button accessibility --- */
      var menuButton = document.querySelector(".w-nav-button");
      if (menuButton) {
        menuButton.setAttribute("aria-expanded", "false");
        menuButton.setAttribute("aria-controls", "w-nav-menu");
        menuButton.setAttribute("role", "button");

        /* --- Focus Trap: keep Tab cycling inside open mobile menu --- */
        var focusTrapHandler = function (e) {
          if (e.key !== "Tab") return;
          var navMenu = document.querySelector(".w-nav-menu");
          if (!navMenu || !navMenu.classList.contains("w--open")) return;

          var focusable = navMenu.querySelectorAll(
            'a[href], button, [tabindex]:not([tabindex="-1"]), input, select, textarea'
          );
          if (focusable.length === 0) return;

          var first = focusable[0];
          var last = focusable[focusable.length - 1];

          // Include burger button in the trap cycle
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            menuButton.focus();
          } else if (e.shiftKey && document.activeElement === menuButton) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            menuButton.focus();
          } else if (!e.shiftKey && document.activeElement === menuButton) {
            e.preventDefault();
            first.focus();
          }
        };
        document.addEventListener("keydown", focusTrapHandler);

        // Track open/close state
        var menuObserver = new MutationObserver(function () {
          var navMenu = document.querySelector(".w-nav-menu");
          var isOpen = navMenu && navMenu.classList.contains("w--open");
          menuButton.setAttribute("aria-expanded", isOpen ? "true" : "false");
        });
        var navMenu = document.querySelector(".w-nav-menu");
        if (navMenu) {
          navMenu.setAttribute("id", "w-nav-menu");
          navMenu.setAttribute("role", "navigation");
          navMenu.setAttribute("aria-label", "Main menu");
          menuObserver.observe(navMenu, { attributes: true, attributeFilter: ["class"] });
        }
      }

      /* --- ARIA: Set up language dropdown accessibility --- */
      var langDropdowns = document.querySelectorAll(".cmp--dd-nav-link.w-dropdown");
      langDropdowns.forEach(function (dropdown) {
        var toggle = dropdown.querySelector(".w-dropdown-toggle");
        var list = dropdown.querySelector(".w-dropdown-list");
        if (toggle && list) {
          toggle.setAttribute("aria-haspopup", "true");
          toggle.setAttribute("aria-expanded", "false");
          list.setAttribute("role", "menu");
          list.querySelectorAll("a[data-lang]").forEach(function (item) {
            item.setAttribute("role", "menuitem");
          });
          // Update aria-expanded on hover/click
          dropdown.addEventListener("mouseenter", function () {
            toggle.setAttribute("aria-expanded", "true");
          });
          dropdown.addEventListener("mouseleave", function () {
            toggle.setAttribute("aria-expanded", "false");
          });
          // Keyboard: Enter/Space opens dropdown, arrow keys navigate
          toggle.addEventListener("keydown", function (e) {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              var isOpen = toggle.getAttribute("aria-expanded") === "true";
              toggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
              list.style.display = isOpen ? "" : "block";
              if (!isOpen) {
                var firstItem = list.querySelector("a[data-lang]");
                if (firstItem) firstItem.focus();
              }
            }
          });
          list.addEventListener("keydown", function (e) {
            var items = list.querySelectorAll("a[data-lang]");
            var idx = Array.prototype.indexOf.call(items, document.activeElement);
            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (idx < items.length - 1) items[idx + 1].focus();
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              if (idx > 0) items[idx - 1].focus();
              else toggle.focus();
            } else if (e.key === "Tab") {
              toggle.setAttribute("aria-expanded", "false");
              list.style.display = "";
            }
          });
        }
      });

      document.querySelectorAll(".cmp--hd-nav-link:not([data-lang])").forEach(function (link) {
        // Skip links inside the language switcher dropdown
        if (link.closest("#language-switcher")) return;
        link.addEventListener("click", handleNavigation);
      });

      // Handle dynamically added nav links.
      // Disconnect the observer after 10 seconds to prevent indefinite DOM monitoring (memory leak).
      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === 1 && node.querySelectorAll) {
              var newLinks = node.querySelectorAll(".cmp--hd-nav-link:not([data-lang])");
              newLinks.forEach(function (link) {
                if (!link.hasAttribute("data-custom-handler") && !link.closest("#language-switcher")) {
                  link.setAttribute("data-custom-handler", "true");
                  link.addEventListener("click", handleNavigation);
                }
              });
            }
          });
        });
      });

      if (document.body) {
        observer.observe(document.body, { childList: true, subtree: true });

        // Disconnect observer after 10 seconds — dynamic nav links should be loaded by then
        setTimeout(function () {
          observer.disconnect();
        }, 10000);
      }
    }
  }, 100);
});
