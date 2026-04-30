/* Dropdown Arrow Fix
   Webflow IX2 applies a Web Animation to the language switcher arrow icon
   that blocks CSS transforms. This script cancels those animations so the
   CSS :hover rotation rule in custom.css can take effect. */

document.addEventListener("DOMContentLoaded", function () {
  // Small delay to ensure Webflow IX2 has initialized its animations
  setTimeout(function () {
    var selectors = [".w-icon-dropdown-toggle", ".wr_ico--hd-nav-link"];
    selectors.forEach(function (sel) {
      var el = document.querySelector(".cmp--dd-nav-link " + sel);
      if (el && el.getAnimations) {
        el.getAnimations().forEach(function (anim) { anim.cancel(); });
      }
    });
  }, 200);
});


/* Remove legacy inline <style> blocks that conflict with custom.css
   language dropdown rules. Cached HTML pages may still contain these
   inline blocks — this cleanup ensures custom.css is the single
   source of truth for underline behaviour. */
(function () {
  var styles = document.querySelectorAll("style");
  styles.forEach(function (s) {
    if (s.textContent.indexOf("Language selector styles") !== -1) {
      s.parentNode.removeChild(s);
    }
  });
})();
