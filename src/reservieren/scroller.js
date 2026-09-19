/* Snap-Scroll [data-scroll="snap"]
   Quelle (Webflow, Stand 2026-09-19): Embed .scroller-js */

  (function () {
    /* ==============================
     CONFIG
     ============================== */

    var BREAKPOINT = 992;
    var EPS = 2;
    var DEFAULT_STEP = 0.9;

    /* ==============================
     HELPERS
     ============================== */

    function px(v) {
      if (v == null) return null;
      var n = parseFloat(v);
      return isNaN(n) ? null : n + 'px';
    }

    function apply(el) {
      var gm = px(el.getAttribute('data-gap-m'));
      var gd = px(el.getAttribute('data-gap-d'));

      if (gm) el.style.setProperty('--gap-mobile', gm);
      if (gd) el.style.setProperty('--gap-desktop', gd);
    }

    /* Prüft, ob Scroller auf aktuellem Breakpoint aktiv ist */
    function isActive(scroller) {
      var desktop = window.innerWidth >= BREAKPOINT;

      if (desktop) {
        return scroller.getAttribute('data-scroll-desktop') !== 'false';
      }

      return scroller.getAttribute('data-scroll-mobile') !== 'false';
    }

    function getScrollerById(id) {
      return document.querySelector('[data-scroll="snap"][data-scroll-id="' + id + '"]');
    }

    function getStepPx(scroller) {
      var pxStep = parseFloat(scroller.getAttribute('data-scroll-step-px'));

      if (!isNaN(pxStep) && pxStep > 0) {
        return pxStep;
      }

      var step = parseFloat(scroller.getAttribute('data-scroll-step'));

      if (isNaN(step) || step <= 0) {
        step = DEFAULT_STEP;
      }

      return Math.max(1, scroller.clientWidth * step);
    }

    function atStart(scroller) {
      return scroller.scrollLeft <= EPS;
    }

    function atEnd(scroller) {
      var max = scroller.scrollWidth - scroller.clientWidth;

      return scroller.scrollLeft >= max - EPS;
    }

    function setDisabled(btn, on) {
      if (!btn) return;

      btn.classList.toggle('disabled', on);
    }

    /* ==============================
     BUTTON STATES
     ============================== */

    function updateButtons(id) {
      var scroller = getScrollerById(id);

      if (!scroller) return;

      var prev = document.querySelector('[data-scroll-btn="prev"][data-scroll-target="' + id + '"]');

      var next = document.querySelector('[data-scroll-btn="next"][data-scroll-target="' + id + '"]');

      /* Scroller auf diesem Breakpoint deaktiviert */
      if (!isActive(scroller)) {
        setDisabled(prev, true);
        setDisabled(next, true);
        return;
      }

      setDisabled(prev, atStart(scroller));

      setDisabled(next, atEnd(scroller));
    }

    /* ==============================
     BUTTON SCROLL
     ============================== */

    function scrollByBtn(id, dir) {
      var scroller = getScrollerById(id);

      if (!scroller || !isActive(scroller)) return;

      var delta = getStepPx(scroller) * (dir === 'next' ? 1 : -1);

      scroller.scrollBy({
        left: delta,
        top: 0,
        behavior: 'smooth',
      });
    }

    /* ==============================
     INIT BUTTONS
     ============================== */

    function initButtons() {
      document.querySelectorAll('[data-scroll-btn][data-scroll-target]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (btn.classList.contains('disabled')) return;

          var dir = btn.getAttribute('data-scroll-btn');

          var id = btn.getAttribute('data-scroll-target');

          scrollByBtn(id, dir);
        });
      });

      document.querySelectorAll('[data-scroll="snap"][data-scroll-id]').forEach(function (scroller) {
        var id = scroller.getAttribute('data-scroll-id');

        var raf = 0;

        function onScroll() {
          if (raf) {
            cancelAnimationFrame(raf);
          }

          raf = requestAnimationFrame(function () {
            updateButtons(id);

            raf = 0;
          });
        }

        scroller.addEventListener('scroll', onScroll, { passive: true });

        updateButtons(id);
      });

      window.addEventListener(
        'resize',
        function () {
          document.querySelectorAll('[data-scroll="snap"][data-scroll-id]').forEach(function (scroller) {
            updateButtons(scroller.getAttribute('data-scroll-id'));
          });
        },
        { passive: true },
      );
    }

    /* ==============================
     INIT
     ============================== */

    function init() {
      document.querySelectorAll('[data-scroll="snap"]').forEach(apply);

      initButtons();
    }

    if (document.readyState !== 'loading') {
      init();
    } else {
      document.addEventListener('DOMContentLoaded', init);
    }
  })();
