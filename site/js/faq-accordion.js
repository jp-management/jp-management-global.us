/* FAQ Accordion – standalone fallback (only activates when Webflow ix2 is NOT available) */
(function () {
  document.addEventListener("DOMContentLoaded", function () {
    /* If the Webflow runtime loaded successfully, ix2 handles FAQ accordion natively */
    try {
      if (window.Webflow && typeof Webflow.require === 'function' && Webflow.require('ix2')) return;
    } catch (e) {}

    var faqs = document.querySelectorAll(".cmp--faq");
    if (!faqs.length) return;

    faqs.forEach(function (faq) {
      var answer = faq.querySelector(".cmp--faq-answer");
      var icon = faq.querySelector(".ico--faq");
      if (!answer) return;

      /* Collapse all answers initially */
      answer.style.height = "0px";
      answer.style.overflow = "hidden";
      answer.style.transition = "height 0.3s ease";

      /* Rotate icon to "closed" state (chevron pointing down) */
      if (icon) {
        icon.style.transition = "transform 0.3s ease";
        icon.style.transform = "rotate(180deg)";
      }

      faq.addEventListener("click", function () {
        var isOpen = faq.classList.contains("faq--open");

        if (isOpen) {
          /* Close */
          answer.style.height = answer.scrollHeight + "px";
          /* Force reflow so browser registers the explicit height */
          answer.offsetHeight;
          answer.style.height = "0px";
          faq.classList.remove("faq--open");
          if (icon) icon.style.transform = "rotate(180deg)";
        } else {
          /* Close all other FAQs first (one-at-a-time) */
          faqs.forEach(function (other) {
            if (other !== faq && other.classList.contains("faq--open")) {
              var otherAnswer = other.querySelector(".cmp--faq-answer");
              var otherIcon = other.querySelector(".ico--faq");
              if (otherAnswer) {
                otherAnswer.style.height = otherAnswer.scrollHeight + "px";
                otherAnswer.offsetHeight;
                otherAnswer.style.height = "0px";
              }
              other.classList.remove("faq--open");
              if (otherIcon) otherIcon.style.transform = "rotate(180deg)";
            }
          });

          /* Open this one */
          answer.style.height = answer.scrollHeight + "px";
          faq.classList.add("faq--open");
          if (icon) icon.style.transform = "rotate(0deg)";

          /* After transition, set height to auto so content can reflow */
          answer.addEventListener("transitionend", function handler() {
            if (faq.classList.contains("faq--open")) {
              answer.style.height = "auto";
            }
            answer.removeEventListener("transitionend", handler);
          });
        }
      });
    });
  });
})();
