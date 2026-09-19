/* Toggle Switch [data-toggle-init]
   Quelle (Webflow, Stand 2026-09-19): Page Settings Head, Skript 4 */

(function () {
  'use strict';
  function initToggleSwitches(scope) {
    var cleanups = [];
    (scope || document).querySelectorAll("[data-toggle-init]").forEach(function (toggle) {
      if (toggle.dataset.toggleBound) return;
      var buttons = [].slice.call(toggle.querySelectorAll("[data-toggle-btn]"));
      if (buttons.length < 2) return;
      toggle.dataset.toggleBound = '1';
      toggle.style.setProperty("--toggle-count", buttons.length);
      var activeIndex = buttons.findIndex(function (btn) { return btn.hasAttribute("data-toggle-active"); });
      if (activeIndex < 0) activeIndex = 0;
      function setActive(index, silent) {
        activeIndex = index;
        toggle.style.setProperty("--toggle-active", index);
        buttons.forEach(function (btn, i) {
          var isActive = i === index;
          btn.setAttribute("aria-pressed", isActive ? "true" : "false");
          btn.toggleAttribute("data-toggle-active", isActive);
          btn.classList.toggle("is-active", isActive);
          btn.tabIndex = isActive ? 0 : -1;
        });
        if (!silent) {
          toggle.dispatchEvent(new CustomEvent('toggleswitch:change', {
            bubbles: true,
            detail: { index: index, button: buttons[index] }
          }));
        }
      }
      function onClick(event) {
        var index = buttons.indexOf(event.currentTarget);
        if (index !== activeIndex) setActive(index);
      }
      function onKeydown(event) {
        var dir = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
        if (!dir) return;
        event.preventDefault();
        var next = (activeIndex + dir + buttons.length) % buttons.length;
        setActive(next);
        buttons[next].focus();
      }
      buttons.forEach(function (btn) {
        btn.addEventListener("click", onClick);
        btn.addEventListener("keydown", onKeydown);
      });
      setActive(activeIndex, true);
      cleanups.push(function () {
        buttons.forEach(function (btn) {
          btn.removeEventListener("click", onClick);
          btn.removeEventListener("keydown", onKeydown);
        });
      });
    });
    return function () { cleanups.forEach(function (fn) { fn(); }); };
  }
  window.initToggleSwitches = initToggleSwitches;
  document.addEventListener("DOMContentLoaded", function () {
    initToggleSwitches();
  });
})();
