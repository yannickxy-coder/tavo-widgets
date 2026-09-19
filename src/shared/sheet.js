/* Bottom Sheet v3 · Scrim wird in Webflow gebaut ([data-sheet-scrim], Klasse .is-open)
   Quelle: von Yay geliefert am 19.09.2026, ersetzt v2 (performance) */

(function () {
  'use strict';

  /* ------------------------------------------------------------
     Scrim: wird NICHT mehr erzeugt oder gestylt. Du baust ihn in
     Webflow (fixed, inset 0) und gibst ihm data-sheet-scrim="<name>"
     (oder leer / "*" fuer alle Sheets). Das Skript setzt beim Oeffnen
     nur die Klasse "is-open" (ueberschreibbar per
     data-sheet-scrim-class="…") -- Look und Transition kommen
     komplett aus dem Designer.
     Waehrend des Ziehens wird opacity kurz inline gesetzt, damit der
     Scrim dem Finger folgt; danach wird sie wieder entfernt.
  ------------------------------------------------------------ */

  var _cs = getComputedStyle(document.documentElement);
  function cssVar(n, fb) { return _cs.getPropertyValue(n).trim() || fb; }
  function cssMs(n, fb) {
    var v = _cs.getPropertyValue(n).trim(), f = parseFloat(v);
    if (!v || isNaN(f)) return fb;
    return v.indexOf('ms') > -1 ? f : f * 1000;
  }
  var IN    = cssVar('--sheet-in',  'cubic-bezier(.32,.72,0,1)');
  var OUT   = cssVar('--sheet-out', 'cubic-bezier(.4,0,.86,.6)');
  var D_IN  = cssMs('--sheet-in-dur',  400);
  var D_OUT = cssMs('--sheet-out-dur', 340);

  var FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';
  var lockCount = 0;
  var drag = new WeakMap();
  var opener = new WeakMap();
  var closeTimer = new WeakMap();
  var observers = new WeakMap();
  var cache = new WeakMap();

  var all    = function () { return [].slice.call(document.querySelectorAll('[data-sheet]')); };
  var nameOf = function (s) { return s.getAttribute('data-sheet') || ''; };
  var isOpen = function (s) { return !!(s && s.hasAttribute('data-sheet-shown')); };
  var reduce = function () { return matchMedia('(prefers-reduced-motion: reduce)').matches; };

  function byName(ref) {
    if (!ref) return null;
    if (ref.nodeType === 1) return ref;
    return document.querySelector('[data-sheet="' + ref + '"]');
  }
  function num(s, attr, fb) {
    var v = parseFloat(s.getAttribute('data-sheet-' + attr));
    return isNaN(v) ? fb : v;
  }

  /* Radius: Attribute sitzen auf dem [data-sheetnav]-Element
     (data-sheet-radius-start/-end, jeweils optional -desktop ab 992px). */
  var ISTDESKTOP = function () { return matchMedia('(min-width: 992px)').matches; };
  function radiusZiel(s) {
    if (s.hasAttribute('data-sheetnav')) return s;
    return s.querySelector('[data-sheetnav]') || s;
  }
  function radiusWert(s, ende) {
    var ziel = radiusZiel(s);
    var basisAttr = ende ? 'data-sheet-radius-end' : 'data-sheet-radius-start';
    var wert = ISTDESKTOP() ? ziel.getAttribute(basisAttr + '-desktop') : null;
    if (wert === null) wert = ziel.getAttribute(basisAttr);
    var n = parseFloat(wert);
    if (!isNaN(n)) return n;
    return ende ? 0 : 32;
  }
  function radiusAnwenden(s) {
    s.style.setProperty('--sheet-radius', radiusWert(s, s.hasAttribute('data-sheet-settled')) + 'px');
  }

  function isSheetMode(s) {
    return matchMedia('(max-width:' + (parseInt(s.getAttribute('data-sheet-breakpoint') || '767', 10)) + 'px)').matches;
  }

  function listMatches(value, name) {
    if (value === null) return false;
    var v = value.trim();
    return v === '' || v === '*' || v.split(/[\s,]+/).indexOf(name) > -1;
  }

  function state(s) {
    var c = cache.get(s);
    if (!c) { c = {}; cache.set(s, c); }
    return c;
  }
  function invalidate(s) { cache.delete(s); }

  /* ---------- Scrim (in Webflow gebaut) ---------- */

  function scrimOf(s) {
    var c = state(s);
    if (c.scrim !== undefined && (!c.scrim || c.scrim.isConnected)) return c.scrim;
    var key = nameOf(s) || 'default';
    var el = [].filter.call(document.querySelectorAll('[data-sheet-scrim]'), function (x) {
      return listMatches(x.getAttribute('data-sheet-scrim'), key);
    })[0] || null;
    if (el && !el.dataset.sheetBound) {
      el.dataset.sheetBound = '1';
      el.addEventListener('click', function () { var t = topmost(); if (t) close(t); });
    }
    c.scrim = el;
    return el;
  }
  function scrimClass(el) { return el.getAttribute('data-sheet-scrim-class') || 'is-open'; }
  function scrimShow(s, on) {
    var el = scrimOf(s);
    if (!el) return;
    scrimLive(el, null);
    el.classList.toggle(scrimClass(el), on);
  }
  // Waehrend Drag: opacity folgt dem Finger. null = zurueck an Webflow.
  function scrimLive(el, t) {
    if (!el) return;
    if (t === null) {
      el.style.transition = '';
      el.style.opacity = '';
    } else {
      el.style.transition = 'none';
      el.style.opacity = String(t);
    }
  }

  /* ---------- Stapel (mehrere Sheets uebereinander) ---------- */

  var Z_BASE = 9990, Z_STEP = 10, stack = [];

  function restack() {
    stack.forEach(function (s, i) {
      var z = Z_BASE + i * Z_STEP;
      var scrim = scrimOf(s);
      if (scrim) scrim.style.zIndex = String(z + 1);
      s.style.zIndex = String(z + 2);
    });
  }
  function pushStack(s) {
    var i = stack.indexOf(s);
    if (i > -1) stack.splice(i, 1);
    stack.push(s);
    restack();
  }
  function popStack(s) {
    var i = stack.indexOf(s);
    if (i > -1) stack.splice(i, 1);
    s.style.zIndex = '';
    var scrim = state(s).scrim;
    if (scrim && !stack.some(function (o) { return scrimOf(o) === scrim; })) scrim.style.zIndex = '';
    restack();
  }
  function topmost() {
    for (var i = stack.length - 1; i >= 0; i--) {
      if (isOpen(stack[i]) && !stack[i].hasAttribute('data-sheet-static')) return stack[i];
    }
    return null;
  }

  /* ---------- Helfer ---------- */

  function scrollableAt(target, sheet) {
    var el = target;
    while (el && el.nodeType === 1 && el !== sheet) {
      var oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll' || oy === 'overlay') &&
          el.scrollHeight - el.clientHeight > 2) return el;
      el = el.parentElement;
    }
    var marked = sheet.querySelector('[data-sheet-scroller]');
    return (marked && marked.scrollHeight - marked.clientHeight > 2) ? marked : sheet;
  }

  function resetScroll(s) {
    if (!s) return;
    var c = state(s);
    if (!c.scrollers) c.scrollers = [s].concat([].slice.call(s.querySelectorAll('[data-sheet-scroller]')));
    function sweep() {
      c.scrollers.forEach(function (el) {
        if (!el.scrollTop && !el.scrollLeft) return;
        var prev = el.style.scrollBehavior;
        el.style.scrollBehavior = 'auto';
        el.scrollTop = 0; el.scrollLeft = 0;
        el.style.scrollBehavior = prev || '';
      });
    }
    sweep();
    requestAnimationFrame(sweep);
    setTimeout(sweep, 80);
  }

  function repaint(s) {
    [].forEach.call(s.querySelectorAll('[data-sheet-scroller]'), function (el) {
      var prev = el.style.display;
      el.style.display = 'none';
      void el.offsetHeight;
      el.style.display = prev || '';
    });
  }

  function unhide(s) {
    if (getComputedStyle(s).display !== 'none') return;
    s.style.display = s.getAttribute('data-sheet-display') || 'block';
  }

  function lock(on) {
    lockCount = Math.max(0, lockCount + (on ? 1 : -1));
    document.documentElement.toggleAttribute('data-sheet-locked', lockCount > 0);
  }
  function emit(kind, s, extra) {
    document.dispatchEvent(new CustomEvent('sheet:' + kind, {
      detail: Object.assign({ name: nameOf(s), sheet: s }, extra || {})
    }));
  }

  function setY(s, y, h) {
    s.style.transform = 'translate3d(0,' + y + 'px,0)';
    var t = Math.max(0, Math.min(1, 1 - y / (h || s.offsetHeight || 1)));
    scrimLive(scrimOf(s), t);
  }

  function settle(s, d) {
    setTimeout(function () {
      s.style.transition = '';
      s.setAttribute('data-sheet-settled', '');
      radiusAnwenden(s);
    }, d + 40);
  }

  /* ---------- Oeffnen / Schliessen ---------- */

  function open(ref, trigger) {
    var s = byName(ref);
    if (!s) return;
    unhide(s);
    applyMode(s);
    if (isOpen(s)) return;
    if (trigger) opener.set(s, trigger);

    clearGesture(s);
    clearTimeout(closeTimer.get(s));
    setCollapsed(s, false);
    s.setAttribute('data-sheet-shown', '');
    s.removeAttribute('aria-hidden');
    s.removeAttribute('inert');
    repaint(s);
    resetScroll(s);

    if (!isSheetMode(s)) { syncTriggers(s); emit('open', s); return; }

    lock(true);
    s.removeAttribute('data-sheet-settled');
    radiusAnwenden(s);
    pushStack(s);
    scrimShow(s, true);

    s.style.transition = 'none';
    s.style.transform = 'translate3d(0,100%,0)';
    void s.offsetHeight;

    requestAnimationFrame(function () {
      var d = reduce() ? 1 : D_IN;
      s.style.transition = 'transform ' + d + 'ms ' + IN;
      s.style.transform = 'translate3d(0,0,0)';
      settle(s, d);
    });

    setTimeout(function () {
      var t = s.querySelector('[data-sheet-focus]') || s.querySelector(FOCUSABLE);
      if (t) try { t.focus({ preventScroll: true }); } catch (e) {}
    }, D_IN * 0.8);

    syncTriggers(s);
    emit('open', s);
  }

  function close(ref, fromVelocity) {
    var s = byName(ref);
    if (!s || !isOpen(s)) return;
    clearGesture(s);

    if (!isSheetMode(s)) {
      s.removeAttribute('data-sheet-shown');
      resetScroll(s);
      syncTriggers(s); emit('close', s);
      return;
    }

    var d = reduce() ? 1 : D_OUT;
    if (fromVelocity && fromVelocity > 0.6) d = Math.max(180, D_OUT - (fromVelocity - 0.6) * 160);

    lock(false);
    s.removeAttribute('data-sheet-settled');
    radiusAnwenden(s);

    void s.offsetHeight;
    s.style.transition = 'transform ' + d + 'ms ' + OUT;
    s.style.transform = 'translate3d(0,100%,0)';

    // Scrim nur ausblenden, wenn kein anderes offenes Sheet ihn noch nutzt
    var scrim = scrimOf(s);
    var shared = scrim && stack.some(function (o) { return o !== s && isOpen(o) && scrimOf(o) === scrim; });
    if (!shared) scrimShow(s, false); else scrimLive(scrim, null);

    closeTimer.set(s, setTimeout(function () {
      resetScroll(s);
      s.removeAttribute('data-sheet-shown');
      s.style.transition = '';
      s.style.transform = '';
      popStack(s);
      if (isSheetMode(s)) { s.setAttribute('inert', ''); s.setAttribute('aria-hidden', 'true'); }
      setTimeout(function () { resetScroll(s); }, 80);
    }, d + 20));

    var back = opener.get(s);
    if (back && document.contains(back)) try { back.focus({ preventScroll: true }); } catch (e) {}

    syncTriggers(s);
    emit('close', s);
  }

  function toggle(ref, trigger) {
    var s = byName(ref);
    if (!s) return;
    isOpen(s) ? close(s) : open(s, trigger);
  }

  function syncTriggers(s) {
    var n = nameOf(s);
    if (!n) return;
    var on = isOpen(s) ? 'true' : 'false';
    document.querySelectorAll('[data-sheet-open="' + n + '"],[data-sheet-toggle="' + n + '"]')
      .forEach(function (b) { b.setAttribute('aria-expanded', on); });
  }

  function applyMode(s) {
    var sheet = isSheetMode(s);
    var prev = s.getAttribute('data-sheet-mode');
    var next = sheet ? 'sheet' : 'inline';
    if (prev === next) return;
    s.setAttribute('data-sheet-mode', next);
    if (!sheet) {
      s.removeAttribute('inert'); s.removeAttribute('aria-hidden');
      if (!isOpen(s)) resetScroll(s);
      s.style.transform = ''; s.style.transition = ''; s.style.zIndex = '';
      s.removeAttribute('data-sheet-dragging');
      var sc = state(s).scrim;
      if (sc) { scrimLive(sc, null); sc.classList.remove(scrimClass(sc)); sc.style.zIndex = ''; }
      var i = stack.indexOf(s);
      if (i > -1) { stack.splice(i, 1); restack(); }
    } else if (!isOpen(s)) {
      s.setAttribute('inert', ''); s.setAttribute('aria-hidden', 'true');
    }
    if (prev) emit('mode', s, { mode: next });
  }

  /* ---------- Einklappender Header ---------- */

  function setCollapsed(s, on) {
    if (s._sheetCollapsed === on) return;
    s._sheetCollapsed = on;
    var c = state(s);
    if (!c.activeTargets) c.activeTargets = [].slice.call(s.querySelectorAll('[data-sheet-active]'));
    var fallback = (s.querySelector('[data-sheet-active-class]') || s).getAttribute('data-sheet-active-class') || 'active';
    c.activeTargets.forEach(function (el) {
      (el.getAttribute('data-sheet-active-class') || fallback).split(/\s+/).forEach(function (cl) {
        if (cl) el.classList.toggle(cl, on);
      });
      el.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
    var head = s.querySelector('[data-sheet-header]');
    if (head) head.toggleAttribute('data-sheet-collapsed', on);
    emit('collapse', s, { collapsed: on });
  }

  function watchHeader(s, force) {
    var sentinel = s.querySelector('[data-sheet-sentinel]');
    if (!sentinel) return;
    var head = s.querySelector('[data-sheet-header]');
    var offset = parseFloat(s.getAttribute('data-sheet-active-offset')) || 0;
    var headH = head ? head.offsetHeight : 0;

    var c = state(s);
    if (!force && observers.has(s) && c.headH === headH) return;
    c.headH = headH;

    var prev = observers.get(s);
    if (prev) { prev.disconnect(); observers.delete(s); }

    var scroller = s.querySelector('[data-sheet-scroller]') || s;

    if (typeof IntersectionObserver === 'undefined') {
      if (!s._sheetScrollBound) {
        s._sheetScrollBound = 1;
        scroller.addEventListener('scroll', function () {
          setCollapsed(s, scroller.scrollTop > sentinel.offsetTop + sentinel.offsetHeight - headH - offset);
        }, { passive: true });
      }
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      setCollapsed(s, !entries[0].isIntersecting);
    }, {
      root: scroller === s ? null : scroller,
      rootMargin: (-(headH + offset)) + 'px 0px 0px 0px',
      threshold: 0
    });
    io.observe(sentinel);
    observers.set(s, io);
  }

  /* ---------- Gesten ---------- */

  function beginTouch(s, t, target) {
    if (s.hasAttribute('data-sheet-static') || !isSheetMode(s) || !isOpen(s)) return;
    if (target.closest && target.closest('input,textarea,select,[contenteditable]')) return;
    var top = topmost();
    if (top && top !== s) return;

    drag.set(s, {
      phase: 'pending',
      handle: !!(target.closest && target.closest('[data-sheet-handle]')),
      sc: scrollableAt(target, s),
      startY: t.clientY, startX: t.clientX,
      y: 0, vel: 0,
      t0: performance.now(), y0: t.clientY,
      h: s.offsetHeight || 400
    });
  }

  function moveTouch(s, t, e) {
    var st = drag.get(s);
    if (!st || st.phase === 'dead') return;

    var dy = t.clientY - st.startY;
    var dx = t.clientX - st.startX;

    if (st.phase === 'pending') {
      if (Math.abs(dy) < 2 && Math.abs(dx) < 2) return;
      if (Math.abs(dx) > Math.abs(dy)) { st.phase = 'dead'; return; }
      if (dy < 0 && !st.handle) { st.phase = 'dead'; return; }
      if (!st.handle && st.sc && st.sc.scrollTop > 0) { st.phase = 'dead'; return; }

      st.phase = 'drag';
      st.startY = st.y0 = t.clientY;
      st.t0 = performance.now();
      dy = 0;
      s.removeAttribute('data-sheet-settled');
      radiusAnwenden(s);
      s.setAttribute('data-sheet-dragging', '');
      document.documentElement.setAttribute('data-sheet-grabbing', '');
      s.style.transition = 'none';
    }

    if (dy < 0) dy = -Math.pow(-dy, 0.68) * 0.35;

    var now = performance.now(), dt = now - st.t0;
    if (dt > 0) st.vel = st.vel * 0.7 + ((t.clientY - st.y0) / dt) * 0.3;
    st.t0 = now; st.y0 = t.clientY; st.y = dy;

    setY(s, dy, st.h);
    if (e.cancelable) e.preventDefault();
    emit('drag', s, { offset: dy, progress: Math.min(1, Math.max(0, dy / st.h)) });
  }

  function endTouch(s) {
    var st = drag.get(s);
    drag.delete(s);
    if (!st || st.phase !== 'drag') return;

    s.removeAttribute('data-sheet-dragging');
    document.documentElement.removeAttribute('data-sheet-grabbing');

    var idle = performance.now() - st.t0;
    var vel = idle > 120 ? 0 : st.vel * (1 - idle / 120);

    if (st.y + vel * 140 > num(s, 'threshold', 0.25) * st.h || vel > num(s, 'velocity', 0.55)) {
      close(s, vel); return;
    }

    // Nicht weit genug gezogen: Sheet springt zurueck
    var d = reduce() ? 1 : Math.max(240, Math.min(D_IN * 0.8, 240 + st.y * 0.9));
    void s.offsetHeight;
    s.style.transition = 'transform ' + d + 'ms ' + IN;
    s.style.transform = 'translate3d(0,0,0)';
    scrimLive(scrimOf(s), null);
    settle(s, d);
  }

  function clearGesture(s) {
    drag.delete(s);
    s.removeAttribute('data-sheet-dragging');
    document.documentElement.removeAttribute('data-sheet-grabbing');
  }

  /* ---------- Binding ---------- */

  function bindTriggers() {
    document.querySelectorAll('[data-sheet-open]:not([data-sheet-trigger])').forEach(function (b) {
      if (b.hasAttribute('data-sheet')) return;
      b.dataset.sheetTrigger = '1';
      if (!b.hasAttribute('role') && b.tagName !== 'BUTTON' && b.tagName !== 'A') b.setAttribute('role', 'button');
      b.addEventListener('click', function (e) { e.preventDefault(); open(b.getAttribute('data-sheet-open'), b); });
    });
    document.querySelectorAll('[data-sheet-toggle]:not([data-sheet-trigger])').forEach(function (b) {
      b.dataset.sheetTrigger = '1';
      b.addEventListener('click', function (e) { e.preventDefault(); toggle(b.getAttribute('data-sheet-toggle'), b); });
    });
    document.querySelectorAll('[data-sheet-close]:not([data-sheet-trigger])').forEach(function (b) {
      if (b.hasAttribute('data-sheet')) return;
      b.dataset.sheetTrigger = '1';
      b.addEventListener('click', function (e) {
        e.preventDefault();
        var ref = b.getAttribute('data-sheet-close');
        close(ref ? ref : b.closest('[data-sheet]'));
      });
    });
  }

  function bind() {
    all().forEach(function (s) {
      if (!s.dataset.sheetBound) {
        s.dataset.sheetBound = '1';
        unhide(s);

        s.addEventListener('touchstart', function (e) {
          if (e.touches.length !== 1) { drag.delete(s); return; }
          beginTouch(s, e.touches[0], e.target);
        }, { passive: true });
        s.addEventListener('touchmove', function (e) {
          if (e.touches.length === 1) moveTouch(s, e.touches[0], e);
        }, { passive: false });
        s.addEventListener('touchend', function () { endTouch(s); }, { passive: true });
        s.addEventListener('touchcancel', function () { endTouch(s); }, { passive: true });

        s.addEventListener('mousedown', function (e) {
          if (e.button !== 0) return;
          beginTouch(s, e, e.target);
          function mm(ev) { moveTouch(s, ev, ev); }
          function mu() {
            endTouch(s);
            removeEventListener('mousemove', mm);
            removeEventListener('mouseup', mu);
          }
          addEventListener('mousemove', mm);
          addEventListener('mouseup', mu);
        });

        s.setAttribute('data-sheet-mode', isSheetMode(s) ? 'inline' : 'sheet');
        applyMode(s);
        radiusAnwenden(s);
        setCollapsed(s, false);
        watchHeader(s, true);
        if (s.hasAttribute('data-sheet-start-open')) open(s);
      } else {
        applyMode(s);
        watchHeader(s);
      }
      syncTriggers(s);
    });
    bindTriggers();
  }

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    var t = topmost();
    if (t) close(t);
  });

  var rt;
  addEventListener('resize', function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      all().forEach(function (s) {
        invalidate(s);
        applyMode(s);
        watchHeader(s);
        radiusAnwenden(s);
      });
    }, 150);
  }, { passive: true });

  if (typeof MutationObserver !== 'undefined') {
    var mt;
    var RELEVANT = '[data-sheet],[data-sheet-open],[data-sheet-close],[data-sheet-toggle],[data-sheet-scrim]';
    new MutationObserver(function (list) {
      for (var i = 0; i < list.length; i++) {
        var added = list[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var n = added[j];
          if (n.nodeType !== 1) continue;
          if (n.matches(RELEVANT) || n.querySelector(RELEVANT)) {
            clearTimeout(mt);
            mt = setTimeout(function () { all().forEach(invalidate); bind(); }, 60);
            return;
          }
        }
      }
    }).observe(document.body, { childList: true, subtree: true });
  }

  window.Sheet = {
    open: open, close: close, toggle: toggle,
    isOpen:    function (r) { return isOpen(byName(r)); },
    mode:      function (r) { var s = byName(r); return s ? s.getAttribute('data-sheet-mode') : null; },
    collapsed: function (r) { var s = byName(r); return !!(s && s._sheetCollapsed); },
    stack:     function () { return stack.slice(); },
    top:       topmost,
    remeasure: function (r) { var s = byName(r); if (s) { invalidate(s); watchHeader(s, true); } },
    refresh:   function () { all().forEach(invalidate); bind(); }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
