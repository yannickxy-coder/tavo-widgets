/* Scroll-Header (Scroll-Container im Sheet)
   Quelle (Webflow, Stand 2026-09-19): Reservieren Widget · Embed .sheet-nav-header-scroller */

(() => {
  "use strict";

  function getScrollParent(el) {
    let parent = el.parentElement;

    while (parent) {
      const style = getComputedStyle(parent);

      if (
        /auto|scroll|overlay/.test(style.overflowY) &&
        parent.scrollHeight > parent.clientHeight
      ) {
        return parent;
      }

      parent = parent.parentElement;
    }

    return window;
  }

  function init() {
    document.querySelectorAll("[scroll-header]").forEach(header => {

      const id = header.getAttribute("scroll-header");

      const trigger = document.querySelector(
        `[scroll-trigger="${CSS.escape(id)}"]`
      );

      if (!trigger) {
        console.warn(`[scroll-header] Trigger "${id}" fehlt`);
        return;
      }

      const className =
        header.getAttribute("scroll-class") || "is-visible";

      const offset =
        parseFloat(header.getAttribute("scroll-offset")) || 0;

      /*
       * Wichtig für dein SheetNav:
       * Wenn der Header selbst der Scroll-Container ist,
       * benutzen wir ihn direkt.
       */
      let scroller;

      if (
        /auto|scroll|overlay/.test(
          getComputedStyle(header).overflowY
        )
      ) {
        scroller = header;
      } else {
        scroller = getScrollParent(trigger);
      }

      let ticking = false;

      function update() {
        ticking = false;

        let referenceTop = 0;

        if (scroller !== window) {
          referenceTop =
            scroller.getBoundingClientRect().top;
        }

        const triggerTop =
          trigger.getBoundingClientRect().top;

        const active =
          triggerTop <= referenceTop + offset;

        header.classList.toggle(
          className,
          active
        );
      }

      function requestUpdate() {
        if (ticking) return;

        ticking = true;

        requestAnimationFrame(update);
      }

      scroller.addEventListener(
        "scroll",
        requestUpdate,
        { passive: true }
      );

      window.addEventListener(
        "resize",
        requestUpdate,
        { passive: true }
      );

      update();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }
})();
