/*! tavo-widgets/reservieren v1.0.0 · yaaay.studio */
/* ---- reservieren/steps.js ---- */
try {
/* Stepper [data-tavo-steps]
   Quelle (Webflow, Stand 2026-09-19): Page Settings Head, Skript 1 */

(function () {
 'use strict';
 function qs(root, sel)  { return root.querySelector(sel); }
 function qsa(root, sel) { return [].slice.call(root.querySelectorAll(sel)); }
 function init(stage) {
  if (stage.dataset.tavoStepsBound) return;
  stage.dataset.tavoStepsBound = '1';
  var steps = qsa(stage, '[data-tavo-step]');
  if (!steps.length) return console.warn('[tavo-steps] keine [data-tavo-step] gefunden');
  var progressWrap = qs(stage, '[data-tavo-step-progress]');
  var segTpl = progressWrap && qs(progressWrap, '[data-tavo-step-progress-segment]');
  var segmente = [];
  if (progressWrap && segTpl) {
   progressWrap.style.setProperty('--seg-count', steps.length);
   segTpl.remove();
   for (var s = 0; s < steps.length; s++) {
    var seg = segTpl.cloneNode(true);
    progressWrap.appendChild(seg);
    segmente.push(seg);
   }
  }
  var stepOf = qs(stage, '[data-tavo-step-of]');
  var aktuell = 0;
  function fehlerZeigen(step, text) {
   var el = qs(step, '[data-tavo-step-error]');
   if (el) el.textContent = text || '';
  }
  function schrittGueltig(step) {
   var pflicht = qsa(step, '[required]');
   for (var i = 0; i < pflicht.length; i++) {
    if (!pflicht[i].checkValidity()) {
     pflicht[i].reportValidity();
     fehlerZeigen(step, '');
     return false;
    }
   }
   var datum = qs(step, '[data-tavo-date]');
   if (datum && !datum.value) {
    fehlerZeigen(step, 'Bitte ein Datum waehlen.');
    return false;
   }
   var calGrid = qs(step, '[data-tavo-cal-grid]');
   if (calGrid && !qs(calGrid, '.is-active')) {
    fehlerZeigen(step, 'Bitte ein Datum waehlen.');
    return false;
   }
   var zeitListe = qs(step, '[data-tavo-time-list]');
   if (zeitListe && !qs(zeitListe, '.is-active')) {
    fehlerZeigen(step, 'Bitte eine Uhrzeit waehlen.');
    return false;
   }
   var bereichWrap = qs(step, '[data-tavo-area-wrap]');
   if (bereichWrap && getComputedStyle(bereichWrap).display !== 'none') {
    var bereichListe = qs(bereichWrap, '[data-tavo-area-list]');
    if (bereichListe && !qs(bereichListe, '.is-active')) {
     fehlerZeigen(step, 'Bitte einen Bereich waehlen.');
     return false;
    }
   }
   fehlerZeigen(step, '');
   return true;
  }
  function malen() {
   steps.forEach(function (step, i) {
    step.style.display = i === aktuell ? '' : 'none';
   });
   var zurueckBtns = qsa(steps[aktuell], '[data-tavo-step-back]');
   zurueckBtns.forEach(function (b) { b.disabled = aktuell === 0; });
   segmente.forEach(function (seg, i) {
    var fuellung = qs(seg, '[data-tavo-step-progress-fill]');
    (fuellung || seg).classList.toggle('is-active', i <= aktuell);
   });
   if (stepOf) stepOf.textContent = (aktuell + 1) + ' von ' + steps.length;
   var fokus = qs(steps[aktuell], 'input, select, textarea, button');
   if (fokus && !('ontouchstart' in window)) fokus.focus({ preventScroll: true });
   stage.dispatchEvent(new CustomEvent('tavo:step-change', {
    detail: { index: aktuell, total: steps.length }
   }));
  }
  function weiter() {
   if (!schrittGueltig(steps[aktuell])) return;
   if (aktuell < steps.length - 1) { aktuell++; malen(); }
  }
  function zurueck() {
   if (aktuell > 0) { aktuell--; malen(); }
  }
  stage.addEventListener('click', function (e) {
   if (e.target.closest('[data-tavo-step-next]')) { e.preventDefault(); weiter(); }
   if (e.target.closest('[data-tavo-step-back]')) { e.preventDefault(); zurueck(); }
  });
  document.addEventListener('tavo:booked', function () {
   aktuell = 0;
   malen();
  });
  malen();
 }
 function start() {
  qsa(document, '[data-tavo-steps]').forEach(init);
 }
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
 else start();
})();

} catch (e) { console.error('[tavo-widgets] reservieren/steps.js', e); }

/* ---- reservieren/shop-info.js ---- */
try {
/* Restaurant-Stammdaten [data-tavo-shop]
   Quelle (Webflow, Stand 2026-09-19): Page Settings Head, Skript 2 */

(function () {
 'use strict';
 var WD = ['So','Mo','Di','Mi','Do','Fr','Sa'];
 function setShop(feld, wert) {
  document.querySelectorAll('[data-tavo-shop="' + feld + '"]').forEach(function (el) {
   el.textContent = wert == null || wert === '' ? '' : wert;
  });
 }
 function stundenText(rows) {
  var byWindow = {};
  rows.forEach(function (r) {
   var key = r.opens.slice(0, 5) + '-' + r.closes.slice(0, 5);
   (byWindow[key] = byWindow[key] || []).push(r.weekday);
  });
  var teile = [];
  Object.keys(byWindow).forEach(function (key) {
   var tage = byWindow[key].slice().sort(function (a, b) { return a - b; });
   var bereiche = [];
   var start = tage[0], prev = tage[0];
   for (var i = 1; i <= tage.length; i++) {
    if (i < tage.length && tage[i] === prev + 1) { prev = tage[i]; continue; }
    bereiche.push(start === prev ? WD[start] : WD[start] + '–' + WD[prev]);
    if (i < tage.length) { start = prev = tage[i]; }
   }
   var zeiten = key.split('-');
   teile.push(bereiche.join(', ') + ' ' + zeiten[0] + '–' + zeiten[1] + ' Uhr');
  });
  return teile.join(' · ');
 }
 function start() {
  var wrap = document.querySelector('[data-tavo-restaurant]');
  if (!wrap || !window.supabase || !window.TAVO_ANON_KEY) return;
  var slug = wrap.getAttribute('data-tavo-restaurant');
  var db = window.supabase.createClient('https://wiwhbszwkuekxkdiqcgd.supabase.co', window.TAVO_ANON_KEY);
  db.from('restaurants').select('id,name,address,phone,email,max_party_size')
   .eq('slug', slug).single().then(function (r) {
    if (r.error || !r.data) return;
    var rest = r.data;
    window.tavoRestaurant = rest;
    setShop('name', rest.name);
    setShop('address', rest.address);
    setShop('phone', rest.phone);
    setShop('email', rest.email);
    setShop('max_party_size', rest.max_party_size);
    var heuteWd = new Date().getDay();
    db.from('opening_hours').select('weekday,opens,closes')
     .eq('restaurant_id', rest.id)
     .then(function (oh) {
      var alle = oh.data || [];
      setShop('hours_week', alle.length ? stundenText(alle) : 'Keine Öffnungszeiten hinterlegt');
      var heute = alle.filter(function (w) { return w.weekday === heuteWd; })
       .map(function (w) { return w.opens.slice(0, 5) + '–' + w.closes.slice(0, 5); }).join(', ');
      setShop('hours_today', heute || 'Heute geschlossen');
     });
    db.from('seating_areas').select('name')
     .eq('restaurant_id', rest.id).eq('active', true).order('position', { ascending: true })
     .then(function (sa) {
      var namen = (sa.data || []).map(function (a) { return a.name; });
      setShop('seating_areas', namen.join(' · '));
     });
   });
 }
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
 else start();
})();

} catch (e) { console.error('[tavo-widgets] reservieren/shop-info.js', e); }

/* ---- reservieren/step-gate.js ---- */
try {
/* Weiter-Button-Gate + Fortschritt fuer SheetNav
   Quelle (Webflow, Stand 2026-09-19): Page Settings Head, Skript 3 */

(function () {
  'use strict';
  function qs(r,s) { return r.querySelector(s); }
  function qsa(r,s) { return [].slice.call(r.querySelectorAll(s)); }

  function fehlerZeigen(scope, text) {
    var el = qs(scope, '[data-tavo-step-error]');
    if (el) el.textContent = text || '';
  }

  function schrittGueltig(scope, stumm) {
    var pflicht = qsa(scope, '[required]');
    for (var i = 0; i < pflicht.length; i++) {
      if (!pflicht[i].checkValidity()) {
        if (!stumm) { pflicht[i].reportValidity(); fehlerZeigen(scope, ''); }
        return false;
      }
    }
    var calGrid = qs(scope, '[data-tavo-cal-grid]');
    if (calGrid && !qs(calGrid, '.is-active')) {
      if (!stumm) fehlerZeigen(scope, 'Bitte ein Datum wählen.');
      return false;
    }
    var zeitListe = qs(scope, '[data-tavo-time-list]');
    if (zeitListe && !qs(zeitListe, '.is-active')) {
      if (!stumm) fehlerZeigen(scope, 'Bitte eine Uhrzeit wählen.');
      return false;
    }
    var bereichWrap = qs(scope, '[data-tavo-area-wrap]');
    if (bereichWrap && getComputedStyle(bereichWrap).display !== 'none') {
      var bereichListe = qs(bereichWrap, '[data-tavo-area-list]');
      if (bereichListe && !qs(bereichListe, '.is-active')) {
        if (!stumm) fehlerZeigen(scope, 'Bitte einen Bereich wählen.');
        return false;
      }
    }
    if (!stumm) fehlerZeigen(scope, '');
    return true;
  }

  // Fuer Events (open/back/home): den Namen direkt aus dem Event
  // nehmen, nicht aufs data-sheetnav-active-Attribut warten -- das
  // wird bei zurueck()/heim() erst NACH der Animation entfernt,
  // waere also in diesem Moment noch veraltet.
  function seiteVonName(stage, name) {
    if (!name) return qs(stage, '[data-sheetnav-root]');
    return qs(stage, '[data-sheetnav-page="' + name + '"]');
  }

  // Die aktuelle Seite wird NICHT mehr per querySelector aus dem
  // data-sheetnav-active-Attribut abgeleitet -- SheetNav entfernt
  // dieses Attribut von der VORHERIGEN Seite erst zeitversetzt nach
  // der Animation, wodurch kurzzeitig (oder bei schnellem Klicken
  // laenger) ZWEI Seiten gleichzeitig als aktiv markiert sein
  // koennen. querySelector liefert dann einfach die erste im DOM,
  // nicht zwingend die tatsaechlich sichtbare -- das fuehrte genau
  // zu dem Bug, dass Button/Fortschritt schon "Step 3" zeigten,
  // waehrend der sichtbare Inhalt noch Step 2 war. Stattdessen wird
  // der Name jetzt ausschliesslich ueber die sheetnav:open/back/home
  // Events gepflegt (siehe unten), die ihn direkt und zuverlaessig
  // aus SheetNavs eigenem Stapel mitliefern.
  function aktuelleSeiteSetzen(stage, name) {
    stage.dataset.tavoAktuelleSeite = name || '';
  }

  function aktuelleSeiteName(stage) {
    return stage.dataset.tavoAktuelleSeite || '';
  }

  function aktiverBereich(stage) {
    return seiteVonName(stage, aktuelleSeiteName(stage));
  }

  // Der "Weiter"-Button ist EIN geteiltes Element ueber alle Seiten
  // hinweg (sticky Fusszeile in der Bootm-Sheet-Struktur), kein
  // eigener Button pro Seite. Sein data-sheetnav-open-Ziel muss
  // deshalb bei jedem Seitenwechsel neu gesetzt werden -- sonst
  // zeigt er immer auf dieselbe, fest einprogrammierte erste
  // Zielseite, egal wo man gerade steht (der urspruengliche Bug).
  var NAECHSTE_SEITE = { '': 'step-2', 'step-2': 'step-3' };

  function weiterButtonAktualisieren(stage, seite) {
    var naechste = NAECHSTE_SEITE[seite || ''];
    qsa(stage, '[data-tavo-step-next]').forEach(function (btn) {
      var label = btn.firstElementChild;
      if (naechste) {
        btn.setAttribute('data-sheetnav-open', naechste);
        btn.removeAttribute('data-tavo-submit');
        if (label) label.textContent = 'Weiter';
      } else {
        btn.removeAttribute('data-sheetnav-open');
        btn.setAttribute('data-tavo-submit', '');
        if (label) label.textContent = 'Reservieren';
      }
    });
  }

  function zustandSetzen(stage, scope, seite) {
    weiterButtonAktualisieren(stage, seite);
    if (!scope) return;
    var gueltig = schrittGueltig(scope, true);
    qsa(stage, '[data-tavo-step-next]').forEach(function (btn) {
      btn.classList.toggle('is-disabled', !gueltig);
      btn.toggleAttribute('disabled', !gueltig);
    });
  }

  function zustandAktualisieren(stage) {
    zustandSetzen(stage, aktiverBereich(stage), aktuelleSeiteName(stage));
  }

  function bindGate(btn) {
    if (btn.dataset.tavoGateBound) return;
    btn.dataset.tavoGateBound = '1';
    btn.addEventListener('click', function (e) {
      var stage = btn.closest('[data-sheetnav]');
      if (!stage) return;
      var scope = aktiverBereich(stage);
      if (!scope) return;
      if (!schrittGueltig(scope)) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      }
    });
  }

  function segmenteBauen(stage) {
    var wrap = qs(stage, '[data-tavo-step-progress]');
    if (!wrap || wrap.dataset.tavoSegBuilt) return;
    var tpl = qs(wrap, '[data-tavo-step-progress-segment]');
    if (!tpl) return;
    var anzahl = 1 + qsa(stage, '[data-sheetnav-page]').length;
    wrap.style.setProperty('--seg-count', anzahl);
    wrap.dataset.tavoSegBuilt = '1';
    tpl.remove();
    for (var i = 0; i < anzahl; i++) wrap.appendChild(tpl.cloneNode(true));
  }

  function segmenteAktualisieren(stage, tiefe) {
    var wrap = qs(stage, '[data-tavo-step-progress]');
    if (!wrap) return;
    qsa(wrap, '[data-tavo-step-progress-segment]').forEach(function (seg, i) {
      var fuellung = qs(seg, '[data-tavo-step-progress-fill]');
      (fuellung || seg).classList.toggle('is-active', i <= tiefe);
    });
    var of = qs(stage, '[data-tavo-step-of]');
    if (of) {
      var gesamt = 1 + qsa(stage, '[data-sheetnav-page]').length;
      of.textContent = 'Schritt ' + (tiefe + 1) + ' von ' + gesamt;
    }
  }

  function bindBeobachtung(stage) {
    if (stage.dataset.tavoWatchBound) return;
    stage.dataset.tavoWatchBound = '1';
    stage.addEventListener('click', function () {
      zustandAktualisieren(stage);
    });
    stage.addEventListener('input', function () {
      zustandAktualisieren(stage);
    });
  }

  function start() {
    qsa(document, '[data-tavo-step-next]').forEach(bindGate);
    qsa(document, '[data-sheetnav]').forEach(function (stage) {
      if (stage.dataset.tavoAktuelleSeite === undefined) aktuelleSeiteSetzen(stage, '');
      bindBeobachtung(stage);
      zustandAktualisieren(stage);
      if (!qs(stage, '[data-tavo-step-progress]')) return;
      segmenteBauen(stage);
      segmenteAktualisieren(stage, 0);
    });
  }

  document.addEventListener('sheetnav:open', function (e) {
    var d = e.detail || {};
    if (!d.stage) return;
    aktuelleSeiteSetzen(d.stage, d.page);
    segmenteAktualisieren(d.stage, d.depth);
    zustandSetzen(d.stage, seiteVonName(d.stage, d.page), d.page);
  });
  document.addEventListener('sheetnav:back', function (e) {
    var d = e.detail || {};
    if (!d.stage) return;
    aktuelleSeiteSetzen(d.stage, d.page);
    segmenteAktualisieren(d.stage, d.depth);
    zustandSetzen(d.stage, seiteVonName(d.stage, d.page), d.page);
  });
  document.addEventListener('sheetnav:home', function (e) {
    var d = e.detail || {};
    if (!d.stage) return;
    aktuelleSeiteSetzen(d.stage, '');
    segmenteAktualisieren(d.stage, 0);
    zustandSetzen(d.stage, qs(d.stage, '[data-sheetnav-root]'), '');
  });

  // Feuert, sobald tavo-booking.js die Uhrzeiten-Liste fertig neu
  // aufgebaut hat (nach Datums- oder Personenzahl-Aenderung). Ohne
  // dies wuerde der Button-Zustand nur beim naechsten Klick neu
  // geprueft -- also einen Schritt zu spaet, da tL() asynchron laeuft.
  document.addEventListener('tavo:time-list-updated', function () {
    qsa(document, '[data-sheetnav]').forEach(zustandAktualisieren);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

} catch (e) { console.error('[tavo-widgets] reservieren/step-gate.js', e); }

/* ---- reservieren/toggle-switch.js ---- */
try {
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

} catch (e) { console.error('[tavo-widgets] reservieren/toggle-switch.js', e); }

/* ---- shared/ios-corners.js ---- */
try {
/* iOS Corners (Radius/Border aus Webflow-Styles)
   Quelle (Webflow, Stand 2026-09-19): Reservieren Widget · Embed .ios-corners-js */

document.addEventListener("DOMContentLoaded", () => {
  if (!window.CornerKit) return;

  const ck = new CornerKit();
  const active = new WeakSet();
  const selector = "[data-ios-corners]";

  const num = (v, fallback, min, max) => {
    v = parseFloat(v);
    return Number.isFinite(v)
      ? Math.min(max, Math.max(min, v))
      : fallback;
  };

  const px = value => {
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  };

  const apply = el => {
    if (!(el instanceof HTMLElement)) return;

    const style = getComputedStyle(el);

    const radius = px(style.borderTopLeftRadius);
    const borderWidth = px(style.borderTopWidth);
    const borderColor = style.borderTopColor;
    const borderStyle = style.borderTopStyle;

    const smoothing = num(
      el.dataset.iosSmoothing,
      0.6,
      0,
      1
    );

    const config = {
      radius,
      smoothing
    };

    if (
      borderWidth > 0 &&
      borderStyle !== "none" &&
      borderStyle !== "hidden"
    ) {
      config.border = {
        width: borderWidth,
        color: borderColor,
        style: borderStyle
      };
    }

    if (active.has(el)) {
      ck.update(el, config);
    } else {
      ck.apply(el, config);
      active.add(el);
    }
  };

  const scan = root => {
    if (root.matches?.(selector)) apply(root);
    root.querySelectorAll?.(selector).forEach(apply);
  };

  scan(document);

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (
        mutation.type === "attributes" &&
        mutation.target.matches?.(selector)
      ) {
        apply(mutation.target);
      }

      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) scan(node);
      });
    });
  });

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [
      "class",
      "style",
      "data-ios-corners",
      "data-ios-smoothing"
    ]
  });

  window.addEventListener("resize", () => {
    document.querySelectorAll(selector).forEach(apply);
  });
});

} catch (e) { console.error('[tavo-widgets] shared/ios-corners.js', e); }

/* ---- shared/sheet.js ---- */
try {
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

} catch (e) { console.error('[tavo-widgets] shared/sheet.js', e); }

/* ---- shared/sheet-nav.js ---- */
try {
/* SheetNav + Header-Sentinel
   Quelle (Webflow, Stand 2026-09-19): Embed .sheet-nav-js (identisch auf beiden Seiten) */

  (function () {
    'use strict';

    var A = 'data-sheetnav';

    var qa = function (root, selector) {
      return [].slice.call(root.querySelectorAll(selector));
    };

    function eigene(stage, selector) {
      return qa(stage, selector).filter(function (el) {
        return el.closest('[' + A + ']') === stage;
      });
    }

    function eigeneErste(stage, selector) {
      var arr = eigene(stage, selector);

      return arr.length ? arr[0] : null;
    }

    function dauer() {
      var cs = getComputedStyle(document.documentElement);

      var v = cs.getPropertyValue('--sheetnav-dur').trim();

      if (!v) return 340;

      var f = parseFloat(v);

      if (isNaN(f)) return 340;

      return v.indexOf('ms') > -1 ? f : f * 1000;
    }

    function reduce() {
      return matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function zahl(el, name, fallback) {
      var value = el.getAttribute(A + '-' + name);

      if (value === null || value === '') {
        return fallback;
      }

      var n = parseFloat(value);

      return isNaN(n) ? fallback : n;
    }

    var buehnen = [];

    function bauen(stage) {
      if (stage.dataset.sheetnavBound) {
        return null;
      }

      stage.dataset.sheetnavBound = '1';

      var root = eigeneErste(stage, '[' + A + '-root]');

      var seiten = eigene(stage, '[' + A + '-page]');

      if (!root || !seiten.length) {
        console.warn('[SheetNav] Root oder Unterseiten fehlen.', stage);

        delete stage.dataset.sheetnavBound;

        return null;
      }

      var sheet = stage.closest('[data-sheet]');

      var sheetName = sheet ? sheet.getAttribute('data-sheet') || '' : '';

      var ownName = stage.getAttribute(A + '-name');

      var attrName = stage.getAttribute(A);

      var name = ownName || attrName || sheetName || '';

      var shift = parseFloat(stage.getAttribute(A + '-shift'));

      if (isNaN(shift)) shift = 24;

      var dim = parseFloat(stage.getAttribute(A + '-dim'));

      if (isNaN(dim)) dim = 0.5;

      dim = Math.max(0, Math.min(1, dim));

      var hoehe = stage.getAttribute(A + '-height') !== 'off';

      var wischen = stage.getAttribute(A + '-swipe') !== 'off';

      var aktivKlasse = stage.getAttribute(A + '-active-class') || 'is-active';

      var pulsFaktor = zahl(stage, 'pulse', 0.1);

      var stapel = [];

      var animT = null;

      // Wird gesetzt, sobald eine Wisch-Geste selbst schon einen
      // Navigationsschritt ausgeloest hat. Mobile Browser feuern nach
      // touchend haeufig zusaetzlich ein synthetisches click-Event --
      // landet der Finger dabei zufaellig ueber dem sichtbaren
      // Zurueck-Pfeil, wuerde dieser Klick zurueck()/oeffnen() ein
      // zweites Mal ausloesen (z.B. Step 3 -> Step 2 per Wisch, dann
      // sofort nochmal Step 2 -> Root per Phantom-Klick). Der Klick-
      // Handler unten ignoriert deshalb alles innerhalb einer kurzen
      // Sperrzeit nach einer wisch-ausgeloesten Navigation.
      var letzterSwipeNav = 0;

      var nach = {};

      seiten.forEach(function (page) {
        var n = page.getAttribute(A + '-page') || '';

        if (!n) {
          console.warn('[SheetNav] Unterseite ohne Namen.', page);

          return;
        }

        if (nach[n]) {
          console.warn('[SheetNav] Page "' + n + '" kommt mehrfach vor.', page);
        }

        nach[n] = page;
      });

      function aktivesEl() {
        if (!stapel.length) return root;

        return nach[stapel[stapel.length - 1]];
      }

      function istFest(el) {
        return el.hasAttribute(A + '-fixed') || el.hasAttribute('data-sheet-handle') || el.hasAttribute('data-sheet-header') || !!el.querySelector('[' + A + '-fixed]');
      }

      var bewegt = null;

      function bewegteTeile() {
        if (
          bewegt &&
          bewegt.length &&
          bewegt.every(function (el) {
            return el === root ? el.isConnected : el.parentNode === root;
          })
        ) {
          return bewegt;
        }

        var kinder = [].slice.call(root.children);

        var feste = kinder.filter(istFest);

        bewegt = feste.length
          ? kinder.filter(function (el) {
              return !istFest(el);
            })
          : [root];

        return bewegt;
      }

      function messen(el) {
        if (!el) return 0;

        var versteckt = el.hasAttribute(A + '-page') && !el.hasAttribute(A + '-active');

        if (versteckt) {
          el.setAttribute(A + '-measuring', '');
        }

        var height = Math.max(el.offsetHeight, el.scrollHeight);

        if (versteckt) {
          el.removeAttribute(A + '-measuring');
        }

        return height;
      }

      function hoeheSetzen(el, sofort) {
        if (!hoehe) return;

        var h = messen(el);

        if (!h) return;

        if (sofort) {
          stage.style.transition = 'none';

          stage.style.height = h + 'px';

          void stage.offsetHeight;

          stage.style.transition = '';
        } else {
          stage.style.transition = 'height var(--sheetnav-dur) var(--sheetnav-ease)';

          stage.style.height = h + 'px';
        }
      }

      var controls = [];

      if (name) {
        qa(document, '[' + A + '-control="' + CSS.escape(name) + '"]').forEach(function (el) {
          if (controls.indexOf(el) < 0) {
            controls.push(el);
          }
        });
      }

      var morphs = eigene(stage, '[' + A + '-morph]');

      if (sheet) {
        qa(sheet, '[' + A + '-morph]').forEach(function (m) {
          if (m.closest('[' + A + ']') && m.closest('[' + A + ']') !== stage) {
            return;
          }

          if (morphs.indexOf(m) < 0) {
            morphs.push(m);
          }
        });
      }

      controls.forEach(function (control) {
        qa(control, '[' + A + '-morph]').forEach(function (m) {
          if (morphs.indexOf(m) < 0) {
            morphs.push(m);
          }
        });
      });

      if (name) {
        qa(document, '[' + A + '-morph="' + CSS.escape(name) + '"]').forEach(function (m) {
          if (morphs.indexOf(m) < 0) {
            morphs.push(m);
          }
        });
      }

      var schalter = morphs.slice();

      function toggleHinzufuegen(el) {
        if (schalter.indexOf(el) < 0) {
          schalter.push(el);
        }
      }

      eigene(stage, '[' + A + '-toggle]').forEach(toggleHinzufuegen);

      if (sheet) {
        qa(sheet, '[' + A + '-toggle]').forEach(function (el) {
          var v = el.getAttribute(A + '-toggle') || '';

          if (v && v !== name) {
            return;
          }

          toggleHinzufuegen(el);
        });
      }

      if (name) {
        qa(document, '[' + A + '-toggle="' + CSS.escape(name) + '"]').forEach(toggleHinzufuegen);
      }

      controls.forEach(function (control) {
        qa(control, '[' + A + '-toggle]').forEach(toggleHinzufuegen);
      });

      var OHNE_TRANSFORM = 'opacity, width, max-width, min-width, height, max-height,' + ' margin, padding, background-color, color, border-radius,' + ' border-color, box-shadow, gap, filter, backdrop-filter,' + ' font-size, letter-spacing';

      var ELASTIC = 'linear(0,.218,.658,1.045,1.196,1.157,1.043,.967,.955,' + '.982,1.007,1.014,1.007,.999,.997,1)';

      schalter.forEach(function (el) {
        if (!pulsFaktor) return;

        var t = getComputedStyle(el).transitionProperty;

        if (t === 'all' || t.indexOf('transform') > -1) {
          el.style.transitionProperty = OHNE_TRANSFORM;
        }
      });

      function pulsen(el, rein) {
        if (!pulsFaktor || reduce()) {
          return;
        }

        var innen = el.querySelector('[' + A + '-pulse-inner]') || el;

        var b = innen.offsetWidth;

        var h = innen.offsetHeight;

        if (!b || !h) {
          return;
        }

        var faktor = zahl(el, 'pulse', pulsFaktor);

        if (!faktor) return;

        var squash = zahl(el, 'pulse-squash', 0.1);

        var release = zahl(el, 'pulse-release', 1);

        var fs = parseFloat(getComputedStyle(innen).fontSize) || 16;

        var zug = faktor * fs;

        var sx = (b + zug) / b;

        var sy = (h - zug * 0.33) / h;

        var zx = rein ? sx : sy;

        var zy = rein ? sy : sx * 1.3;

        var aussen = rein ? 1 : 0.85;

        if (window.gsap) {
          if (el._navTl && el._navTl.kill) {
            el._navTl.kill();
          }

          var tl = gsap.timeline();

          el._navTl = tl;

          tl.to(innen, {
            scaleX: zx,
            scaleY: zy,
            duration: squash,
            ease: 'power1.out',
          });

          if (innen !== el) {
            tl.to(
              el,
              {
                scale: aussen,
                duration: squash,
                ease: 'power1.out',
              },
              '<',
            );
          }

          tl.to(innen, {
            scaleX: 1,
            scaleY: 1,
            duration: release,
            ease: 'elastic.out(1,0.3)',
          });

          if (innen !== el) {
            tl.to(
              el,
              {
                scale: 1,
                duration: release,
                ease: 'elastic.out(1,0.3)',
              },
              '<',
            );
          }
        } else if (innen.animate) {
          innen.animate(
            [
              {
                transform: 'scale(1,1)',
              },

              {
                transform: 'scale(' + zx + ',' + zy + ')',

                offset: squash / (squash + release),
              },

              {
                transform: 'scale(1,1)',
              },
            ],

            {
              duration: (squash + release) * 1000,

              easing: ELASTIC,

              fill: 'none',
            },
          );
        }
      }

      var morphAn = null;

      function morphSetzen(still) {
        var an = stapel.length > 0;

        if (an === morphAn) {
          return;
        }

        var ersterLauf = morphAn === null;

        morphAn = an;

        morphs.forEach(function (m) {
          m.toggleAttribute(A + '-morph-on', an);
        });

        schalter.forEach(function (el) {
          aktivKlasse.split(/\s+/).forEach(function (klasse) {
            if (klasse) {
              el.classList.toggle(klasse, an);
            }
          });

          el.setAttribute(A + '-state', an ? 'active' : 'idle');
        });

        if (still || ersterLauf) {
          return;
        }

        schalter.forEach(function (el) {
          pulsen(el, an);
        });
      }

      // War bisher IMMER auf bewegteTeile() (= root's eigene Kinder)
      // festgelegt -- das stimmt nur, wenn "die Ebene darunter" auch
      // wirklich root ist. Bei einer Wisch-Geste von Step 3 zurueck
      // zu Step 2 ist "darunter" aber Step 2, nicht root: bewegteTeile()
      // ruehrt dann w.el (Step 3, das eigentlich gezogene Element)
      // gar nicht an, sondern root, das hier komplett fehl am Platz
      // ist. Step 2 bleibt dadurch waehrend der ganzen Geste in seiner
      // starren Warteposition und "springt" erst bei touchend auf die
      // richtige Stelle. Die Berechnung von "darunter" hier entspricht
      // exakt der bereits in endTouch() verwendeten Logik.
      function fortschritt(pr) {
        var darunter = stapel.length > 1 ? nach[stapel[stapel.length - 2]] : root;

        var teile = darunter === root ? bewegteTeile() : [darunter];

        var x = -shift * (1 - pr);

        var opacity = 1 - dim * (1 - pr);

        teile.forEach(function (el) {
          el.style.transition = 'none';

          el.style.transform = 'translate3d(' + x + '%,0,0)';

          el.style.opacity = String(opacity);
        });
      }

      function zurueckSetzen(el, tief) {
        var teile = el === root ? bewegteTeile() : [el];

        teile.forEach(function (teil) {
          teil.style.transition = 'transform var(--sheetnav-dur) var(--sheetnav-ease),' + ' opacity var(--sheetnav-dur) var(--sheetnav-ease)';

          teil.style.transform = tief ? 'translate3d(-' + shift + '%,0,0)' : 'translate3d(0,0,0)';

          teil.style.opacity = tief ? String(1 - dim) : '';

          teil.style.pointerEvents = tief ? 'none' : '';
        });
      }

      function sperren() {
        stage.setAttribute(A + '-animating', '');

        clearTimeout(animT);

        animT = setTimeout(
          function () {
            stage.removeAttribute(A + '-animating');
          },

          reduce() ? 20 : dauer() + 40,
        );
      }

      function scrollerIn(el) {
        var treffer = [];

        if (el.scrollTop > 0) {
          treffer.push(el);
        }

        qa(el, '*').forEach(function (child) {
          if (child.scrollTop <= 0) {
            return;
          }

          var overflow = getComputedStyle(child).overflowY;

          if (overflow === 'auto' || overflow === 'scroll') {
            treffer.push(child);
          }
        });

        return treffer;
      }

      function nachOben(el) {
        if (!el || el === root) {
          return;
        }

        scrollerIn(el).forEach(function (scroller) {
          var prev = scroller.style.scrollBehavior;

          scroller.style.scrollBehavior = 'auto';

          scroller.scrollTop = 0;

          scroller.style.scrollBehavior = prev || '';
        });
      }

      function rastern(el) {
        if (!el) return;

        var merk = [];

        qa(el, '*').forEach(function (child) {
          if (child.scrollTop > 0) {
            merk.push([child, child.scrollTop]);
          }
        });

        var oben = el.scrollTop;

        var prev = el.style.display;

        el.style.display = 'none';

        void el.offsetHeight;

        el.style.display = prev || '';

        el.scrollTop = oben;

        merk.forEach(function (pair) {
          pair[0].scrollTop = pair[1];
        });
      }

      function event(typ, page) {
        document.dispatchEvent(
          new CustomEvent(
            'sheetnav:' + typ,

            {
              detail: {
                page: page || null,

                depth: stapel.length,

                tiefe: stapel.length,

                name: name,

                sheet: sheetName || name,

                stage: stage,
              },
            },
          ),
        );
      }

      function oeffnen(n) {
        var seite = nach[n];

        if (!seite) {
          console.warn('[SheetNav] Unterseite "' + n + '" nicht gefunden.');

          return;
        }

        if (stapel[stapel.length - 1] === n) {
          return;
        }

        var vorher = aktivesEl();

        stapel.push(n);

        sperren();

        hoeheSetzen(seite);

        seite.style.transition = 'none';

        seite.style.transform = 'translateX(100%)';

        seite.style.opacity = '';

        seite.setAttribute(A + '-active', '');

        rastern(seite);

        void seite.offsetHeight;

        seite.style.transition = '';

        requestAnimationFrame(function () {
          seite.style.transform = 'translateX(0)';

          seite.style.pointerEvents = '';

          zurueckSetzen(vorher, true);
        });

        seite.style.zIndex = String(stapel.length);

        nachOben(seite);

        morphSetzen();

        event('open', n);
      }

      function zurueck() {
        if (!stapel.length) return;

        var n = stapel.pop();

        var seite = nach[n];

        var ziel = aktivesEl();

        sperren();

        hoeheSetzen(ziel);

        seite.style.transform = 'translateX(100%)';

        seite.style.pointerEvents = 'none';

        zurueckSetzen(ziel, false);

        setTimeout(
          function () {
            if (stapel.indexOf(n) > -1) {
              return;
            }

            seite.removeAttribute(A + '-active');

            seite.style.zIndex = '';

            seite.style.opacity = '';
          },

          reduce() ? 20 : dauer() + 20,
        );

        morphSetzen();

        event('back', stapel.length ? stapel[stapel.length - 1] : null);
      }

      function heim(emitEvent) {
        var hatteTiefe = stapel.length > 0;

        while (stapel.length) {
          var n = stapel.pop();

          var page = nach[n];

          page.removeAttribute(A + '-active');

          page.style.transform = 'translateX(100%)';

          page.style.zIndex = '';

          page.style.pointerEvents = '';

          page.style.opacity = '';
        }

        zurueckSetzen(root, false);

        hoeheSetzen(root, true);

        morphSetzen();

        if (emitEvent !== false && hatteTiefe) {
          event('home', null);
        }
      }

      stage.addEventListener('click', function (e) {
        // Direkt nach einer wisch-ausgeloesten Navigation kann ein
        // synthetisches click-Event des Browsers denselben Zurueck-
        // Pfeil noch einmal treffen. Solange die Sperrzeit laeuft,
        // wird jeder Klick auf open/back/home hier ignoriert.
        if (performance.now() - letzterSwipeNav < 500) {
          return;
        }

        var open = e.target.closest('[' + A + '-open]');

        if (open && stage.contains(open) && open.closest('[' + A + ']') === stage) {
          e.preventDefault();

          return oeffnen(open.getAttribute(A + '-open'));
        }

        var back = e.target.closest('[' + A + '-back]');

        if (back && stage.contains(back)) {
          if (!stapel.length) {
            return;
          }

          e.preventDefault();

          e.stopPropagation();

          return zurueck();
        }

        var home = e.target.closest('[' + A + '-home]');

        if (home && stage.contains(home)) {
          e.preventDefault();

          return heim();
        }
      });

      if (wischen) {
        var w = null;

        stage.addEventListener(
          'touchstart',

          function (e) {
            if (!stapel.length || e.touches.length !== 1) {
              return;
            }

            var touch = e.touches[0];

            var rect = stage.getBoundingClientRect();

            if (touch.clientX - rect.left > 28) {
              return;
            }

            w = {
              x: touch.clientX,

              y: touch.clientY,

              aktiv: false,

              el: aktivesEl(),
            };
          },

          {
            passive: true,
          },
        );

        stage.addEventListener(
          'touchmove',

          function (e) {
            if (!w || e.touches.length !== 1) {
              return;
            }

            var touch = e.touches[0];

            var dx = touch.clientX - w.x;

            var dy = touch.clientY - w.y;

            if (!w.aktiv) {
              if (Math.abs(dx) < 6 && Math.abs(dy) < 6) {
                return;
              }

              if (Math.abs(dy) > Math.abs(dx)) {
                w = null;

                return;
              }

              w.aktiv = true;

              w.breite = stage.offsetWidth || 1;

              w.el.style.transition = 'none';
            }

            if (dx < 0) dx = 0;

            w.el.style.transform = 'translate3d(' + dx + 'px,0,0)';

            fortschritt(Math.min(1, dx / w.breite));

            if (e.cancelable) {
              e.preventDefault();
            }
          },

          {
            passive: false,
          },
        );

        stage.addEventListener(
          'touchend',

          function () {
            if (!w) return;

            var el = w.el;

            var aktiv = w.aktiv;

            var breite = w.breite || 1;

            w = null;

            if (!aktiv) return;

            el.style.transition = '';

            var matrix;

            try {
              matrix = new DOMMatrix(getComputedStyle(el).transform);
            } catch (_) {
              matrix = null;
            }

            var weg = matrix ? matrix.m41 || 0 : 0;

            if (weg > breite * 0.3) {
              letzterSwipeNav = performance.now();

              zurueck();
            } else {
              el.style.transform = 'translate3d(0,0,0)';

              var darunter = stapel.length > 1 ? nach[stapel[stapel.length - 2]] : root;

              zurueckSetzen(darunter, true);
            }
          },

          {
            passive: true,
          },
        );
      }

      if (sheet) {
        document.addEventListener(
          'sheet:close',

          function (e) {
            var detail = e.detail || {};

            var geschlossen = detail.sheet;

            var passt = geschlossen === sheet || geschlossen === sheetName || geschlossen === name || detail.name === sheetName || detail.name === name;

            if (!passt) return;

            setTimeout(
              function () {
                heim(false);
              },

              reduce() ? 20 : dauer() + 40,
            );
          },
        );
      }

      hoeheSetzen(root, true);

      morphSetzen(true);

      return {
        stage: stage,

        name: name,

        sheet: sheetName,

        open: oeffnen,

        back: zurueck,

        home: heim,

        current: function () {
          return stapel.length ? stapel[stapel.length - 1] : null;
        },

        depth: function () {
          return stapel.length;
        },

        remeasure: function () {
          hoeheSetzen(aktivesEl(), true);
        },
      };
    }

    function start() {
      qa(document, '[' + A + ']').forEach(function (stage) {
        if (!stage.hasAttribute(A)) {
          return;
        }

        var instance = bauen(stage);

        if (instance) {
          if (
            instance.name &&
            buehnen.some(function (b) {
              return b.name === instance.name;
            })
          ) {
            console.warn('[SheetNav] Name "' + instance.name + '" existiert mehrfach.');
          }

          buehnen.push(instance);
        }
      });
    }

    function finden(name) {
      if (name !== undefined && name !== null && name !== '') {
        var treffer = buehnen.filter(function (b) {
          return b.name === name || b.sheet === name;
        });

        if (!treffer.length) {
          console.warn('[SheetNav] Navigation "' + name + '" nicht gefunden.');

          return null;
        }

        return treffer[0];
      }

      if (buehnen.length === 1) {
        return buehnen[0];
      }

      return buehnen[0] || null;
    }

    document.addEventListener(
      'click',

      function (e) {
        var back = e.target.closest('[' + A + '-back]');

        if (back) {
          var ownStage = back.closest('[' + A + ']');

          if (ownStage && ownStage.contains(back)) {
            return;
          }

          var control = back.closest('[' + A + '-control]');

          var name = back.getAttribute(A + '-back') || (control ? control.getAttribute(A + '-control') : '');

          if (name) {
            var instance = finden(name);

            if (instance && instance.depth() > 0) {
              e.preventDefault();

              e.stopPropagation();

              instance.back();

              return;
            }
          }
        }

        var home = e.target.closest('[' + A + '-home]');

        if (home) {
          var homeStage = home.closest('[' + A + ']');

          if (homeStage && homeStage.contains(home)) {
            return;
          }

          var homeControl = home.closest('[' + A + '-control]');

          var homeName = home.getAttribute(A + '-home') || (homeControl ? homeControl.getAttribute(A + '-control') : '');

          if (homeName) {
            var homeInstance = finden(homeName);

            if (homeInstance) {
              e.preventDefault();

              e.stopPropagation();

              homeInstance.home();

              return;
            }
          }
        }

        var open = e.target.closest('[' + A + '-open]');

        if (open) {
          var openStage = open.closest('[' + A + ']');

          if (openStage && openStage.contains(open)) {
            return;
          }

          var openControl = open.closest('[' + A + '-control]');

          var openName = open.getAttribute(A + '-for') || (openControl ? openControl.getAttribute(A + '-control') : '');

          if (!openName) return;

          var openInstance = finden(openName);

          if (!openInstance) return;

          e.preventDefault();

          openInstance.open(open.getAttribute(A + '-open'));
        }
      },

      true,
    );

    var resizeTimer;

    window.addEventListener(
      'resize',

      function () {
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(
          function () {
            buehnen.forEach(function (b) {
              b.remeasure();
            });
          },

          150,
        );
      },

      {
        passive: true,
      },
    );

    document.addEventListener(
      'tavo:hydrated',

      function () {
        buehnen.forEach(function (b) {
          b.remeasure();
        });
      },
    );

    window.SheetNav = {
      open: function (page, name) {
        var b = finden(name);

        if (b) b.open(page);
      },

      back: function (name) {
        var b = finden(name);

        if (b) b.back();
      },

      home: function (name) {
        var b = finden(name);

        if (b) b.home();
      },

      current: function (name) {
        var b = finden(name);

        return b ? b.current() : null;
      },

      depth: function (name) {
        var b = finden(name);

        return b ? b.depth() : 0;
      },

      remeasure: function (name) {
        var b = finden(name);

        if (b) b.remeasure();
      },

      refresh: function () {
        start();
      },
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', start);
    } else {
      start();
    }
  })();

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-sheetnav-page]').forEach((page) => {
      const scroller = page.hasAttribute('data-sheetnav-scroller') ? page : page.querySelector('[data-sheetnav-scroller]') || page;

      const header = page.querySelector('[data-sheetnav-header]');
      const sentinel = page.querySelector('[data-sheetnav-sentinel]');
      const targets = page.querySelectorAll('[data-sheetnav-active]');

      if (!header || !sentinel || !targets.length) return;

      let ticking = false;

      function update() {
        const offset = parseFloat(page.getAttribute('data-sheetnav-active-offset')) || 0;

        const active = sentinel.getBoundingClientRect().top <= header.getBoundingClientRect().bottom + offset;

        targets.forEach((target) => {
          const classes = target.getAttribute('data-sheetnav-active-class') || 'is-scrolling';

          classes.split(/\s+/).forEach((className) => {
            if (className) target.classList.toggle(className, active);
          });
        });

        ticking = false;
      }

      function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
      }

      scroller.addEventListener('scroll', requestUpdate, { passive: true });
      window.addEventListener('resize', requestUpdate);

      update();
    });
  });

} catch (e) { console.error('[tavo-widgets] shared/sheet-nav.js', e); }

/* ---- reservieren/scroller.js ---- */
try {
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

} catch (e) { console.error('[tavo-widgets] reservieren/scroller.js', e); }

/* ---- reservieren/booking.js ---- */
try {
/* Buchungslogik (Supabase)
   Quelle (Webflow, Stand 2026-09-19): Embed ohne Klasse (#9) */

(function () {
 'use strict';
 const FU = 'https://wiwhbszwkuekxkdiqcgd.supabase.co/functions/v1';
 const SU = 'https://wiwhbszwkuekxkdiqcgd.supabase.co';
 function qs(rt2,sel) { return rt2.querySelector(sel); }
 function qsa(rt2,sel) { return [].slice.call(rt2.querySelectorAll(sel)); }
 const pad = n => String(n).padStart(2,'0');
 const iso = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
 const MO = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
 const pl2 = (n, sing, plur) => n === 1 ? '1 ' + sing : n + ' ' + plur;
 async function init(rt2) {
  if (rt2.dataset.tavoBound) return;
  rt2.dataset.tavoBound = '1';
  const slug = rt2.getAttribute('data-tavo-restaurant');
  if (!slug) return console.error('[tavo-booking] data-tavo-restaurant fehlt');
  if (!window.supabase) return console.error('[tavo-booking] supabase-js nicht geladen');
  if (!window.TAVO_ANON_KEY) return console.error('[tavo-booking] window.TAVO_ANON_KEY fehlt');
  const db = window.supabase.createClient(SU,window.TAVO_ANON_KEY);
  const cL = qs(rt2,'[data-tavo-cal-label]');
  const cP = qs(rt2,'[data-tavo-cal-prev]');
  const cN = qs(rt2,'[data-tavo-cal-next]');
  const cG = qs(rt2,'[data-tavo-cal-grid]');
  const cT = cG && qs(cG,'[data-tavo-cal-day]');
  const dI = qs(rt2,'[data-tavo-day-info]');
  const tLi = qs(rt2,'[data-tavo-time-list]');
  const tT = tLi && qs(tLi,'[data-tavo-time-option]');
  const tE = qs(rt2,'[data-tavo-time-empty]');
  const pV = qs(rt2,'[data-tavo-party-value]');
  const pL = qs(rt2,'[data-tavo-party-label]');
  const pMi = qs(rt2,'[data-tavo-party-minus]');
  const pPl = qs(rt2,'[data-tavo-party-plus]');
  const aW = qs(rt2,'[data-tavo-area-wrap]');
  const aL = qs(rt2,'[data-tavo-area-list]');
  const aT = aL && qs(aL,'[data-tavo-area-option]');
  const sE = qs(rt2,'[data-tavo-status]');
  const suE = qs(rt2,'[data-tavo-success]');
  const rE = qs(rt2,'[data-tavo-reference]');
  const honeypot = qs(rt2,'[data-tavo-honeypot]');
  function absendeBtn() { return qs(rt2,'[data-tavo-submit]'); }
  if (cT) cT.remove();
  if (tT) tT.remove();
  if (aT) aT.remove();
  if (suE) suE.style.display = 'none';
  const { data:restaurant,error:rErr } = await db
   .from('restaurants')
   .select('id,name,max_party_size,lead_time_hours,horizon_days')
   .eq('slug',slug)
   .single();
  if (rErr || !restaurant) {
   if (sE) sE.textContent = 'Reservierung ist gerade nicht verfügbar.';
   console.error('[tavo-booking]',rErr && rErr.message);
   return;
  }
  let ar = [];
  let gB = null;
  if (aW) {
   const { data:al } = await db.from('seating_areas')
    .select('id,name,max_party_size').eq('restaurant_id',restaurant.id)
    .eq('active',true).order('position',{ ascending:true });
   ar = al || [];
   aW.style.display = ar.length ? '' :'none';
   if (ar.length && aL && aT) {
    aL.innerHTML = '';
    aL.setAttribute('data-toggle-init','');
    ar.forEach(function (a,i) {
     const opt = aT.cloneNode(true);
     opt.textContent = a.name;
     opt.setAttribute('data-tavo-area-id',a.id);
     opt.setAttribute('data-toggle-btn','');
     if (i === 0) opt.setAttribute('data-toggle-active','');
     opt.classList.toggle('is-active',i === 0);
     aL.appendChild(opt);
    });
    gB = ar[0].id;
    aL.addEventListener('toggleswitch:change',function (e) {
     const btn = e.detail.button;
     gB = btn.getAttribute('data-tavo-area-id');
     qsa(aL,'[data-tavo-area-id]').forEach(function (o) {
      o.classList.toggle('is-active',o === btn);
     });
     const neuesMax = effektivesMax();
     if (party > neuesMax) {
      party = neuesMax;
      partyMeldungSetzen('Für diesen Sitzbereich sind maximal ' + neuesMax + ' Gäste möglich.');
     } else {
      partyMeldungSetzen('');
     }
     pM();
     tL(gD, true);
    });
    if (window.initToggleSwitches) window.initToggleSwitches();
   }
  }
  // Restaurantweites max_party_size ist nur die OBERGRENZE -- ein
  // gewaehlter Sitzbereich kann ein NIEDRIGERES eigenes Limit haben
  // (seating_areas.max_party_size). effektivesMax() liefert immer
  // das kleinere der beiden, abhaengig vom aktuell gewaehlten Bereich.
  function effektivesMax() {
   const restMax = restaurant.max_party_size || 12;
   const bereich = ar.find(function (a) { return a.id === gB; });
   const bereichMax = bereich && bereich.max_party_size;
   return bereichMax ? Math.min(restMax, bereichMax) : restMax;
  }
  // Tages-Auslastung pro Sitzbereich UND Zeit-Slot -- liefert area_load
  // in einem Rutsch fuer den ganzen Tag. Wird bei jedem Datumswechsel
  // neu geladen und dann fuer die Anzeige-Sperren von Uhrzeiten UND
  // Sitzbereichen gemeinsam genutzt.
  let bereichsLast = {};
  async function bereichsLastLaden(datumStr) {
   bereichsLast = {};
   if (!ar.length) return;
   const { data, error } = await db.rpc('area_load', { p_restaurant_id: restaurant.id, p_day: datumStr });
   if (error || !data) return;
   data.forEach(function (row) {
    if (!row.seating_area_id) return;
    const key = row.seating_area_id;
    const d = new Date(row.slot_at);
    const hhmm = pad(d.getHours()) + ':' + pad(d.getMinutes());
    if (!bereichsLast[key]) bereichsLast[key] = {};
    bereichsLast[key][hhmm] = row.frei;
   });
  }
  // Liefert die Anzahl freier Plaetze fuer einen Bereich zu einer
  // Uhrzeit: number (freie Plaetze), null (Kapazitaet 0/nicht gepflegt
  // -- dieser Bereich ist fuer diesen Slot grundsaetzlich nicht
  // buchbar, unabhaengig von der Personenzahl), oder undefined (keine
  // Daten vorhanden, z.B. area_load fehlgeschlagen -- dann NICHT
  // blockieren, um im Zweifel nicht faelschlich zu sperren).
  function bereichFrei(areaId, zeit) {
   const proSlot = bereichsLast[areaId];
   return proSlot ? proSlot[zeit] : undefined;
  }
  // Sperrt Sitzbereiche in der Auswahl, die fuer die aktuell gewaehlte
  // Uhrzeit und Personenzahl keine ausreichende Kapazitaet mehr haben.
  // Ohne gewaehlte Uhrzeit bleibt der Zustand unbekannt -- dann werden
  // alle Bereiche normal anzeigbar gelassen, statt vorschnell zu sperren.
  function bereichsListeAktualisieren() {
   if (!aL) return;
   qsa(aL,'[data-tavo-area-id]').forEach(function (o) {
    if (!gZ) { o.classList.remove('is-disabled'); return; }
    const id = o.getAttribute('data-tavo-area-id');
    const frei = bereichFrei(id, gZ);
    const gesperrt = frei === null ? true : (frei !== undefined ? frei < party : false);
    o.classList.toggle('is-disabled', gesperrt);
   });
  }
  function partyMeldungSetzen(text) {
   const wrap = pV && pV.parentElement;
   if (!wrap) return;
   let meldung = wrap.querySelector('[data-tavo-field-error]');
   if (text) {
    if (!meldung) {
     meldung = document.createElement('div');
     meldung.className = 'tavo-field-error';
     meldung.setAttribute('data-tavo-field-error', '');
     wrap.appendChild(meldung);
    }
    meldung.textContent = text;
    meldung.style.display = '';
   } else if (meldung) {
    meldung.style.display = 'none';
   }
  }
  let party = 2;
  function pM() {
   const max = effektivesMax();
   if (pV) pV.textContent = String(party);
   if (pL) pL.textContent = pl2(party, 'Gast', 'Gäste');
   if (pMi) pMi.disabled = party <= 1;
   if (pPl) pPl.disabled = party >= max;
  }
  if (pMi) pMi.addEventListener('click',function (e) { e.preventDefault(); if (party > 1) { party--; pM(); partyMeldungSetzen(''); tL(gD, true); } });
  if (pPl) pPl.addEventListener('click',function (e) {
   e.preventDefault();
   const max = effektivesMax();
   if (party < max) { party++; pM(); partyMeldungSetzen(''); tL(gD, true); }
   else partyMeldungSetzen('Für diesen Sitzbereich sind maximal ' + max + ' Gäste möglich.');
  });
  pM();
  const htt = new Date(); htt.setHours(0,0,0,0);
  const fD = new Date(Date.now() + (restaurant.lead_time_hours || 0) * 3600000);
  const sD = new Date(Date.now() + (restaurant.horizon_days || 90) * 86400000);
  const oh = await db.from('opening_hours').select('weekday').eq('restaurant_id',restaurant.id);
  const oW = new Set((oh.data || []).map(function (r) { return r.weekday; }));
  let gD = iso(htt);
  let gZ = null;
  let sM = new Date(fD.getFullYear(),fD.getMonth(),1);
  function kM() {
   if (cL) cL.textContent = MO[sM.getMonth()] + ' ' + sM.getFullYear();
   if (!cG || !cT) return;
   cG.innerHTML = '';
   const eT = new Date(sM.getFullYear(),sM.getMonth(),1);
   const lT = new Date(sM.getFullYear(),sM.getMonth() + 1,0);
   const vL = (eT.getDay() + 6) % 7;
   for (let i = 0; i < vL; i++) {
    const ph = document.createElement('div');
    cG.appendChild(ph);
   }
   for (let tag = 1; tag <= lT.getDate(); tag++) {
    const dtm = new Date(sM.getFullYear(),sM.getMonth(),tag);
    const ze = cT.cloneNode(true);
    ze.textContent = String(tag);
    const zF = dtm < new Date(fD.getFullYear(),fD.getMonth(),fD.getDate());

const zS = dtm > sD;

const rt = !oW.has(dtm.getDay());

const gs = zF || zS || rt;

const vg = dtm < htt;

ze.toggleAttribute('data-tavo-cal-disabled', gs);

ze.classList.toggle('is-disabled', gs);

ze.classList.toggle('is-past', vg);

ze.toggleAttribute('disabled', gs);

ze.classList.toggle('is-active', !!gD && iso(dtm) === gD);
    if (!gs) {
     ze.addEventListener('click',function (e) {
      e.preventDefault();
      gD = iso(dtm);
      kM();
      tL(gD, false, true);
     });
    }
    cG.appendChild(ze);
   }
  }
  if (cP) cP.addEventListener('click',function (e) {
   e.preventDefault();
   const vorher = new Date(sM.getFullYear(),sM.getMonth() - 1,1);
   if (vorher.getFullYear() === fD.getFullYear() && vorher.getMonth() < fD.getMonth()
     && vorher.getFullYear() <= fD.getFullYear()) return;
   sM = vorher; kM();
  });
  if (cN) cN.addEventListener('click',function (e) {
   e.preventDefault();
   sM = new Date(sM.getFullYear(),sM.getMonth() + 1,1);
   kM();
  });
  function sA(wn,sMi) {
   const out = [];
   (wn || []).forEach(function (w) {
    const [oh2,om] = w.opens.split(':').map(Number);
    const [ch,cm] = w.closes.split(':').map(Number);
    let t = oh2 * 60 + om; const ende = ch * 60 + cm;
    while (t + (sMi || 30) <= ende) { out.push(pad(Math.floor(t/60)) + ':' + pad(t%60)); t += (sMi||30); }
   });
   return out;
  }
  let tlAnfrage = 0;
  async function tL(datumStr, behalteZeit, scrollHin) {
   if (!datumStr) return;
   const vorherigeZeit = behalteZeit ? gZ : null;
   gZ = null;
   if (sE) sE.textContent = '';
   const eigeneAnfrage = ++tlAnfrage;
   const [tagErgebnis] = await Promise.all([
    db.rpc('reservation_day',{ p_restaurant_id:restaurant.id,p_date:datumStr }),
    bereichsLastLaden(datumStr)
   ]);
   const { data:tag,error } = tagErgebnis;
   if (eigeneAnfrage !== tlAnfrage) return;
   if (error || !tag) { if (dI) dI.textContent = 'Verfügbarkeit konnte nicht geladen werden.'; return; }
   if (dI) dI.textContent = tag.closed ? (tag.closed_label || 'Geschlossen') : (tag.seats_left > 0 ? pl2(tag.seats_left, 'Platz frei', 'Plätze frei') :'Für diesen Tag ausgebucht');
   const sl = sA(tag.windows,30);
   if (!sl.length) {
    if (tE) tE.style.display = '';
    if (tLi) { tLi.innerHTML = ''; tLi.style.display = 'none'; }
    document.dispatchEvent(new CustomEvent('tavo:time-list-updated'));
    zumZeitfeldScrollen(scrollHin);
    return;
   }
   // Ist ein Sitzbereich gewaehlt, entscheidet dessen EIGENE Auslastung
   // zu diesem Slot (aus area_load), nicht nur die restaurantweite
   // Tagessumme -- ein Bereich kann voll sein, waehrend das Restaurant
   // insgesamt noch Platz haette, oder umgekehrt.
   function slotGesperrt(zeit) {
    if (tag.closed) return true;
    if (gB) {
     const frei = bereichFrei(gB, zeit);
     if (frei === null) return true;
     if (frei !== undefined) return frei < party;
    }
    return tag.seats_left < party;
   }
   var irgendEinBuchbar = false;
   if (tLi && tT) {
    tLi.innerHTML = '';
    sl.forEach(function (zeit) {
     const opt = tT.cloneNode(true);
     opt.textContent = zeit + ' Uhr';
     opt.setAttribute('data-tavo-time',zeit);
     const slotZeit = new Date(datumStr + 'T' + zeit + ':00');
     const zuFrueh = slotZeit < fD;
     const nb = slotGesperrt(zeit) || zuFrueh;
     if (!nb) irgendEinBuchbar = true;
     opt.classList.toggle('is-disabled',nb);
     opt.toggleAttribute('disabled',nb);
     if (!nb) {
      opt.addEventListener('click',function (e) {
       e.preventDefault();
       gZ = zeit;
       qsa(tLi,'[data-tavo-time]').forEach(function (o) { o.classList.toggle('is-active',o === opt); });
       bereichsListeAktualisieren();
      });
      if (behalteZeit && zeit === vorherigeZeit) {
       gZ = zeit;
       opt.classList.add('is-active');
      }
     }
     tLi.appendChild(opt);
    });
   }
   if (tE) tE.style.display = irgendEinBuchbar ? 'none' : '';
   if (tLi) tLi.style.display = irgendEinBuchbar ? '' : 'none';
   bereichsListeAktualisieren();
   document.dispatchEvent(new CustomEvent('tavo:time-list-updated'));
   zumZeitfeldScrollen(scrollHin);
  }
  function zumZeitfeldScrollen(scrollHin) {
   if (!scrollHin || !tLi) return;
   requestAnimationFrame(function () {
    const glatt = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' :'smooth';
    const scroller = tLi.closest('[data-sheet-scroller]');
    if (scroller) {
     const scrollerRect = scroller.getBoundingClientRect();
     const elRect = tLi.getBoundingClientRect();
     const deltaOben = elRect.top - scrollerRect.top;
     const deltaUnten = elRect.bottom - scrollerRect.bottom;
     let ziel = null;
     if (deltaOben < 0) ziel = scroller.scrollTop + deltaOben;
     else if (deltaUnten > 0) ziel = scroller.scrollTop + deltaUnten;
     if (ziel !== null) scroller.scrollTo({ top: ziel, behavior: glatt });
    } else {
     tLi.scrollIntoView({ behavior: glatt, block: 'nearest' });
    }
   });
  }
  function zusammenfassungAktualisieren() {
   const setzen = function (key, wert) {
    const el = qs(rt2,'[data-tavo-summary="' + key + '"]');
    if (el) el.textContent = wert || '-';
   };
   const bereich = ar.find(function (a) { return a.id === gB; });
   setzen('area', ar.length ? (bereich ? bereich.name : '') : 'Keine Auswahl');
   setzen('date', gD ? new Date(gD + 'T00:00:00').toLocaleDateString('de-DE',{ weekday:'long',day:'2-digit',month:'2-digit',year:'numeric' }) : '');
   setzen('time', gZ ? gZ + ' Uhr' : '');
   setzen('party', pl2(party,'Gast','Gäste'));
   setzen('name', [fW('guest_first_name'),fW('guest_last_name')].filter(Boolean).join(' '));
   setzen('email', fW('guest_email'));
   setzen('phone', fW('guest_phone') || 'Keine Angabe');
  }
  document.addEventListener('sheetnav:open', function (e) {
   const d = e.detail || {};
   if (d.page !== 'step-3' || !d.stage || !rt2.contains(d.stage)) return;
   zusammenfassungAktualisieren();
  });

  const feldSicherung = {};
  const GESICHERTE_FELDER = ['guest_first_name','guest_last_name','guest_email','guest_phone','note'];
  rt2.addEventListener('input',function (e) {
   const el = e.target.closest('[data-tavo-field]');
   if (!el || el.type === 'checkbox') return;
   const name = el.getAttribute('data-tavo-field');
   if (GESICHERTE_FELDER.indexOf(name) === -1) return;
   feldSicherung[name] = el.value;
  });
  function felderWiederherstellen() {
   GESICHERTE_FELDER.forEach(function (name) {
    if (!(name in feldSicherung)) return;
    const el = qs(rt2,'[data-tavo-field="' + name + '"]');
    if (el && el.value !== feldSicherung[name]) {
     el.value = feldSicherung[name];
     el.dispatchEvent(new Event('input',{ bubbles:true }));
    }
   });
  }
  ['sheetnav:open','sheetnav:back','sheetnav:home'].forEach(function (typ) {
   document.addEventListener(typ,function (e) {
    const d = e.detail || {};
    if (!d.stage || !rt2.contains(d.stage)) return;
    felderWiederherstellen();
    setTimeout(felderWiederherstellen, 60);
    setTimeout(felderWiederherstellen, 200);
    setTimeout(felderWiederherstellen, 500);
   });
  });
  kM();
  tL(gD);
  function fW(name) {
   const el = qs(rt2,'[data-tavo-field="' + name + '"]');
   if (!el) return '';
   if (el.type === 'checkbox') return el.checked;
   return el.value.trim();
  }
  function zFe(text) {
   if (sE) sE.textContent = text;
   const btn = absendeBtn();
   if (btn) { btn.disabled = false; btn.removeAttribute('data-tavo-busy'); }
  }
  let countdownTimer = null;
  function countdownStoppen() {
   if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
   rt2.classList.remove('tavo-success-active');
  }
  async function ab(e) {
   e.preventDefault();
   if (sE) sE.textContent = '';
   if (!gD) return zFe('Bitte ein Datum wählen.');
   if (!gZ) return zFe('Bitte eine Uhrzeit wählen.');
   if (!fW('guest_first_name') || !fW('guest_last_name')) return zFe('Bitte Vor- und Nachnamen angeben.');
   if (!fW('guest_email')) return zFe('Bitte die E-Mail-Adresse angeben.');
   if (ar.length && !gB) return zFe('Bitte einen Bereich wählen.');
   if (!fW('privacy_accepted')) return zFe('Bitte der Datenschutzerklärung zustimmen.');
   const aktivBtn = absendeBtn();
   if (aktivBtn) { aktivBtn.disabled = true; aktivBtn.setAttribute('data-tavo-busy',''); }
   const pl = {
    restaurant:slug,date:gD,time:gZ,party_size:party,
    seating_area_id:gB || undefined,
    guest_first_name:fW('guest_first_name'),guest_last_name:fW('guest_last_name'),guest_email:fW('guest_email'),
    guest_phone:fW('guest_phone'),note:fW('note'),
    newsletter:!!fW('newsletter'),privacy_accepted:!!fW('privacy_accepted'),website:honeypot ? honeypot.value :''
   };
   try {
    const res = await fetch(FU + '/create-reservation',{
     method:'POST',
     headers:{ 'Content-Type':'application/json','apikey':window.TAVO_ANON_KEY,'Authorization':'Bearer ' + window.TAVO_ANON_KEY },
     body:JSON.stringify(pl)
    });
    const out = await res.json();
    if (!res.ok) {
     if (out.field && window.SheetNav) {
      SheetNav.home();
      const rootEl = qs(rt2,'[data-sheetnav-root]');
      const fehlerEl = rootEl && rootEl.querySelector('[data-tavo-step-error]');
      if (fehlerEl) fehlerEl.textContent = out.error || 'Reservierung fehlgeschlagen.';
      if (aktivBtn) { aktivBtn.disabled = false; aktivBtn.removeAttribute('data-tavo-busy'); }
     } else {
      zFe(out.error || 'Reservierung fehlgeschlagen.');
     }
     return;
    }
    rt2.querySelectorAll('[data-tavo-hide-on-success]').forEach(function (el) { el.style.display = 'none'; });
    if (suE) suE.style.display = '';
    if (rE) rE.textContent = out.reference;
    document.dispatchEvent(new CustomEvent('tavo:booked',{ detail:{ reference:out.reference,status:out.status } }));
    rt2.classList.add('tavo-success-active');
    // Kurze Verzoegerung, bevor die Badge-Animation lostippt -- sonst
    // faellt der Inhalts-Wechsel (Formular ausblenden, Erfolgs-Block
    // einblenden) UND der Animationsstart auf denselben Frame, was wie
    // ein einziger, abrupter Sprung wirkt statt wie zwei bewusst
    // aufeinanderfolgende Schritte.
    setTimeout(function () {
     const iconEl = qs(rt2, '.tavo-success-icon');
     if (iconEl) {
      iconEl.classList.remove('is-playing');
      void iconEl.offsetWidth;
      iconEl.classList.add('is-playing');
     }
    }, 250);
    const countdownEl = qs(rt2,'[data-tavo-countdown]');
    let sekunden = 5;
    function countdownText(n) {
     return 'Dieses Fenster schließt sich automatisch in ' + n + ' Sekunde' + (n === 1 ? '' : 'n') + '.';
    }
    if (countdownEl) countdownEl.textContent = countdownText(sekunden);
    if (countdownTimer) clearInterval(countdownTimer);
    countdownTimer = setInterval(function () {
     sekunden--;
     if (sekunden <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
      const sheetEl = rt2.querySelector('[data-sheet]');
      if (sheetEl && window.Sheet) window.Sheet.close(sheetEl);
      return;
     }
     if (countdownEl) countdownEl.textContent = countdownText(sekunden);
    }, 1000);
   } catch (err) {
    zFe('Verbindung fehlgeschlagen. Bitte erneut versuchen.');
    console.error('[tavo-booking]',err);
   } finally {
    if (aktivBtn) { aktivBtn.disabled = false; aktivBtn.removeAttribute('data-tavo-busy'); }
   }
  }
  rt2.addEventListener('click',function (e) {
   if (e.target.closest('[data-tavo-submit]')) ab(e);
  }, true);

  function zuFokusElement(fokus) {
   var ziel = null;
   if (fokus === 'area') ziel = qs(rt2, '[data-tavo-area-wrap]');
   else if (fokus === 'date') ziel = qs(rt2, '[data-tavo-cal-grid]');
   else if (fokus === 'time') ziel = qs(rt2, '[data-tavo-time-list]');
   else if (fokus === 'party') ziel = qs(rt2, '[data-tavo-party-value]');
   else if (fokus === 'name') ziel = qs(rt2, '[data-tavo-field="guest_first_name"]');
   else if (fokus === 'email') ziel = qs(rt2, '[data-tavo-field="guest_email"]');
   else if (fokus === 'phone') ziel = qs(rt2, '[data-tavo-field="guest_phone"]');
   if (!ziel) return;
   const glatt = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
   ziel.scrollIntoView({ behavior: glatt, block: 'center' });
   if (ziel.focus) ziel.focus({ preventScroll: true });
  }

  rt2.addEventListener('click', function (e) {
   const edit = e.target.closest('[data-tavo-edit]');
   if (!edit || !window.SheetNav) return;
   const ziel = edit.getAttribute('data-tavo-edit');
   const fokus = edit.getAttribute('data-tavo-edit-focus');
   if (ziel === 'root') SheetNav.home();
   else if (ziel === 'step-2') SheetNav.back();
   if (fokus) setTimeout(function () { zuFokusElement(fokus); }, 380);
  });

  document.addEventListener('sheet:close',function (e) {
   const d = e.detail || {};
   if (!d.sheet || !rt2.contains(d.sheet)) return;
   countdownStoppen();
   GESICHERTE_FELDER.concat(['newsletter','privacy_accepted']).forEach(function (name) {
    const el = qs(rt2,'[data-tavo-field="' + name + '"]');
    if (!el) return;
    if (el.type === 'checkbox') el.checked = false;
    else el.value = '';
    el.classList.remove('is-invalid');
    const wrap = el.closest('.tavo-field-wrap') || el.parentElement;
    const meldung = wrap && wrap.querySelector('[data-tavo-field-error]');
    if (meldung) meldung.style.display = 'none';
    el.dispatchEvent(new Event('input',{ bubbles:true }));
   });
   if (ar.length && aL) {
    gB = ar[0].id;
    qsa(aL,'[data-tavo-area-id]').forEach(function (o, i) {
     o.classList.toggle('is-active', i === 0);
     o.toggleAttribute('data-toggle-active', i === 0);
    });
    aL.style.setProperty('--toggle-active', 0);
   }
   Object.keys(feldSicherung).forEach(function (k) { delete feldSicherung[k]; });
   party = 2; pM(); partyMeldungSetzen('');
   gD = iso(htt); gZ = null;
   sM = new Date(fD.getFullYear(),fD.getMonth(),1);
   kM(); tL(gD);
   if (sE) sE.textContent = '';
   if (suE) suE.style.display = 'none';
   rt2.querySelectorAll('[data-tavo-hide-on-success]').forEach(function (el) { el.style.display = ''; });
  });
 }
 function start() { qsa(document,'[data-tavo-booking]').forEach(init); }
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start);
 else start();
})();

} catch (e) { console.error('[tavo-widgets] reservieren/booking.js', e); }

/* ---- reservieren/floating-labels.js ---- */
try {
/* Floating Labels .tavo-field-input
   Quelle (Webflow, Stand 2026-09-19): Embed ohne Klasse (#9), 2. Skript */

(function () {
 'use strict';
 function aktualisieren(input) {
  const label = input.previousElementSibling;
  if (!label || !label.classList.contains('tavo-field-label')) return;
  const aktiv = document.activeElement === input || input.value.trim() !== '';
  label.classList.toggle('is-active', aktiv);
 }
 function bindeAlle() {
  document.querySelectorAll('.tavo-field-input').forEach(function (input) {
   if (input.dataset.floatBound) return;
   input.dataset.floatBound = '1';
   aktualisieren(input);
   input.addEventListener('focus', function () { aktualisieren(input); });
   input.addEventListener('blur', function () { aktualisieren(input); });
   input.addEventListener('input', function () { aktualisieren(input); });
  });
 }
 if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindeAlle);
 else bindeAlle();
})();

} catch (e) { console.error('[tavo-widgets] reservieren/floating-labels.js', e); }

/* ---- reservieren/contact-validation.js ---- */
try {
/* Kontaktfelder pruefen + Busy-State
   Quelle (Webflow, Stand 2026-09-19): Embed ohne Klasse (#10) */

(function () {
  'use strict';
  function qs(r,s) { return r.querySelector(s); }
  function qsa(r,s) { return [].slice.call(r.querySelectorAll(s)); }
  var EMAIL_RE = /^\S+@\S+\.\S+$/;

  function telefonGueltig(wert) {
    var w = wert.trim();
    if (!/^[0-9+()\-\s\/]+$/.test(w)) return false;
    var ziffern = w.replace(/\D/g, '');
    return ziffern.length >= 6;
  }

  function fehlerText(el) {
    var name = el.getAttribute('data-tavo-field');
    if (el.type === 'checkbox') return 'Bitte bestätigen.';
    if (el.type === 'email') return 'Bitte eine gültige E-Mail-Adresse angeben.';
    if (name === 'guest_phone') return 'Bitte eine gültige Telefonnummer angeben.';
    if (name === 'guest_first_name' || name === 'guest_last_name') return 'Bitte mindestens 3 Zeichen eingeben.';
    return 'Diese Angabe ist erforderlich.';
  }
  function gueltig(el) {
    var name = el.getAttribute('data-tavo-field');
    var wert = el.value.trim();
    if (el.type === 'checkbox') return el.checked;
    if (el.type === 'email') return wert !== '' && EMAIL_RE.test(wert);
    if (name === 'guest_phone') return telefonGueltig(wert);
    if (name === 'guest_first_name' || name === 'guest_last_name') return wert.length > 2;
    return wert !== '';
  }
  function meldungZeigen(el) {
    var wrap = el.closest('.tavo-field-wrap') || el.parentElement;
    var meldung = wrap.querySelector('[data-tavo-field-error]');
    if (!meldung) {
      meldung = document.createElement('div');
      meldung.className = 'tavo-field-error';
      meldung.setAttribute('data-tavo-field-error', '');
      wrap.appendChild(meldung);
    }
    meldung.textContent = fehlerText(el);
    meldung.style.display = '';
  }
  function meldungVerbergen(el) {
    var wrap = el.closest('.tavo-field-wrap') || el.parentElement;
    var meldung = wrap.querySelector('[data-tavo-field-error]');
    if (meldung) meldung.style.display = 'none';
  }
  function pruefen(el, immerZeigen) {
    var ok = gueltig(el);
    el.classList.toggle('is-invalid', !ok);
    if (!ok && immerZeigen) meldungZeigen(el);
    else if (ok) meldungVerbergen(el);
    return ok;
  }
  function bindeFeld(el) {
    if (el.dataset.tavoValidateBound) return;
    el.dataset.tavoValidateBound = '1';
    el.addEventListener('blur', function () { pruefen(el, true); });
    el.addEventListener('input', function () {
      if (el.classList.contains('is-invalid')) pruefen(el, true);
    });
  }
  function bindeAlle() {
    qsa(document, '[data-tavo-field][required]').forEach(bindeFeld);
  }
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-tavo-step-next]');
    if (!btn) return;
    var stage = btn.closest('[data-sheetnav]') || document;
    var scope = qs(stage, '[data-sheetnav-page][data-sheetnav-active]') || qs(stage, '[data-sheetnav-root]') || stage;
    qsa(scope, '[data-tavo-field][required]').forEach(function (el) {
      bindeFeld(el);
      pruefen(el, true);
    });
  }, true);

  window.tavoFeldGueltig = gueltig;
  window.tavoFeldPruefen = pruefen;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindeAlle);
  else bindeAlle();
})();

} catch (e) { console.error('[tavo-widgets] reservieren/contact-validation.js', e); }

/* ---- shared/header-scroller.js ---- */
try {
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

} catch (e) { console.error('[tavo-widgets] shared/header-scroller.js', e); }

/* ---- reservieren/step-validation.js ---- */
try {
/* Feld-Fehlermeldungen pro Schritt
   Quelle (Webflow, Stand 2026-09-19): Embed ohne Klasse (#12) */

(function () {
  'use strict';
  function qs(r,s) { return r.querySelector(s); }
  function qsa(r,s) { return [].slice.call(r.querySelectorAll(s)); }

  function fehlerZeigen(scope, text) {
    var el = qs(scope, '[data-tavo-step-error]');
    if (el) el.textContent = text || '';
  }

  function feldMeldungSetzen(wrap, text) {
    if (!wrap) return;
    var meldung = wrap.querySelector('[data-tavo-field-error]');
    if (text) {
      if (!meldung) {
        meldung = document.createElement('div');
        meldung.className = 'tavo-field-error';
        meldung.setAttribute('data-tavo-field-error', '');
        wrap.appendChild(meldung);
      }
      meldung.textContent = text;
      meldung.style.display = '';
    } else if (meldung) {
      meldung.style.display = 'none';
    }
  }

  function schrittGueltig(scope, stumm) {
    var pflicht = qsa(scope, '[required]');
    for (var i = 0; i < pflicht.length; i++) {
      var feld = pflicht[i];
      var nativOk = feld.checkValidity();
      var eigenOk = window.tavoFeldGueltig ? window.tavoFeldGueltig(feld) : true;
      if (!nativOk || !eigenOk) {
        if (!stumm) {
          if (!nativOk) feld.reportValidity();
          if (window.tavoFeldPruefen) window.tavoFeldPruefen(feld, true);
        }
        return false;
      }
    }

    var alleOk = true;

    var calGrid = qs(scope, '[data-tavo-cal-grid]');
    if (calGrid) {
      var calOk = !!qs(calGrid, '.is-active');
      if (!stumm) feldMeldungSetzen(calGrid.parentElement, calOk ? '' : 'Bitte ein Datum wählen.');
      if (!calOk) alleOk = false;
    }

    var zeitListe = qs(scope, '[data-tavo-time-list]');
    if (zeitListe) {
      var zeitOk = !!qs(zeitListe, '.is-active');
      if (!stumm) feldMeldungSetzen(zeitListe.parentElement, zeitOk ? '' : 'Bitte eine Uhrzeit wählen.');
      if (!zeitOk) alleOk = false;
    }

    var bereichWrap = qs(scope, '[data-tavo-area-wrap]');
    if (bereichWrap && getComputedStyle(bereichWrap).display !== 'none') {
      var bereichListe = qs(bereichWrap, '[data-tavo-area-list]');
      var bereichOk = !bereichListe || !!qs(bereichListe, '.is-active');
      if (!stumm) feldMeldungSetzen(bereichWrap, bereichOk ? '' : 'Bitte einen Bereich wählen.');
      if (!bereichOk) alleOk = false;
    }

    if (!stumm) fehlerZeigen(scope, '');
    return alleOk;
  }

  function seiteVonName(stage, name) {
    if (!name) return qs(stage, '[data-sheetnav-root]');
    return qs(stage, '[data-sheetnav-page="' + name + '"]');
  }

  function aktuelleSeiteSetzen(stage, name) {
    stage.dataset.tavoAktuelleSeite = name || '';
  }

  function aktuelleSeiteName(stage) {
    return stage.dataset.tavoAktuelleSeite || '';
  }

  function aktiverBereich(stage) {
    return seiteVonName(stage, aktuelleSeiteName(stage));
  }

  var NAECHSTE_SEITE = { '': 'step-2', 'step-2': 'step-3' };

  function weiterButtonAktualisieren(stage, seite) {
    var naechste = NAECHSTE_SEITE[seite || ''];
    qsa(stage, '[data-tavo-step-next]').forEach(function (btn) {
      var label = btn.firstElementChild;
      if (naechste) {
        btn.setAttribute('data-sheetnav-open', naechste);
        btn.removeAttribute('data-tavo-submit');
        if (label) label.textContent = 'Weiter';
      } else {
        btn.removeAttribute('data-sheetnav-open');
        btn.setAttribute('data-tavo-submit', '');
        if (label) label.textContent = 'Reservieren';
      }
    });
  }

  function zustandSetzen(stage, scope, seite) {
    weiterButtonAktualisieren(stage, seite);
    if (!scope) return;
    var gueltig = schrittGueltig(scope, true);
    qsa(stage, '[data-tavo-step-next]').forEach(function (btn) {
      btn.classList.toggle('is-disabled', !gueltig);
      btn.toggleAttribute('disabled', !gueltig);
    });
  }

  function zustandAktualisieren(stage) {
    zustandSetzen(stage, aktiverBereich(stage), aktuelleSeiteName(stage));
  }

  function bindGate(btn) {
    if (btn.dataset.tavoGateBoundV2) return;
    btn.dataset.tavoGateBoundV2 = '1';
    btn.addEventListener('click', function (e) {
      var stage = btn.closest('[data-sheetnav]');
      if (!stage) return;
      var scope = aktiverBereich(stage);
      if (!scope) return;
      if (!schrittGueltig(scope)) {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      }
    });
  }

  function segmenteBauen(stage) {
    var wrap = qs(stage, '[data-tavo-step-progress]');
    if (!wrap || wrap.dataset.tavoSegBuilt) return;
    var tpl = qs(wrap, '[data-tavo-step-progress-segment]');
    if (!tpl) return;
    var anzahl = 1 + qsa(stage, '[data-sheetnav-page]').length;
    wrap.style.setProperty('--seg-count', anzahl);
    wrap.dataset.tavoSegBuilt = '1';
    tpl.remove();
    for (var i = 0; i < anzahl; i++) wrap.appendChild(tpl.cloneNode(true));
  }

  function segmenteAktualisieren(stage, tiefe) {
    var wrap = qs(stage, '[data-tavo-step-progress]');
    if (!wrap) return;
    qsa(wrap, '[data-tavo-step-progress-segment]').forEach(function (seg, i) {
      var fuellung = qs(seg, '[data-tavo-step-progress-fill]');
      (fuellung || seg).classList.toggle('is-active', i <= tiefe);
    });
    var of = qs(stage, '[data-tavo-step-of]');
    if (of) {
      var gesamt = 1 + qsa(stage, '[data-sheetnav-page]').length;
      of.textContent = 'Schritt ' + (tiefe + 1) + ' von ' + gesamt;
    }
  }

  function bindBeobachtung(stage) {
    if (stage.dataset.tavoWatchBoundV2) return;
    stage.dataset.tavoWatchBoundV2 = '1';
    stage.addEventListener('click', function () {
      zustandAktualisieren(stage);
    });
    stage.addEventListener('input', function () {
      zustandAktualisieren(stage);
    });
  }

  function start() {
    qsa(document, '[data-tavo-step-next]').forEach(bindGate);
    qsa(document, '[data-sheetnav]').forEach(function (stage) {
      if (stage.dataset.tavoAktuelleSeite === undefined) aktuelleSeiteSetzen(stage, '');
      bindBeobachtung(stage);
      zustandAktualisieren(stage);
      if (!qs(stage, '[data-tavo-step-progress]')) return;
      segmenteBauen(stage);
      segmenteAktualisieren(stage, 0);
    });
  }

  document.addEventListener('sheetnav:open', function (e) {
    var d = e.detail || {};
    if (!d.stage) return;
    aktuelleSeiteSetzen(d.stage, d.page);
    segmenteAktualisieren(d.stage, d.depth);
    zustandSetzen(d.stage, seiteVonName(d.stage, d.page), d.page);
  });
  document.addEventListener('sheetnav:back', function (e) {
    var d = e.detail || {};
    if (!d.stage) return;
    aktuelleSeiteSetzen(d.stage, d.page);
    segmenteAktualisieren(d.stage, d.depth);
    zustandSetzen(d.stage, seiteVonName(d.stage, d.page), d.page);
  });
  document.addEventListener('sheetnav:home', function (e) {
    var d = e.detail || {};
    if (!d.stage) return;
    aktuelleSeiteSetzen(d.stage, '');
    segmenteAktualisieren(d.stage, 0);
    zustandSetzen(d.stage, qs(d.stage, '[data-sheetnav-root]'), '');
  });

  document.addEventListener('tavo:time-list-updated', function () {
    qsa(document, '[data-sheetnav]').forEach(zustandAktualisieren);
  });

  document.addEventListener('sheet:close', function (e) {
    var d = e.detail || {};
    if (!d.sheet) return;
    qsa(document, '[data-sheetnav]').forEach(function (stage) {
      if (!d.sheet.contains(stage)) return;
      aktuelleSeiteSetzen(stage, '');
      segmenteAktualisieren(stage, 0);
      zustandSetzen(stage, qs(stage, '[data-sheetnav-root]'), '');
    });
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

} catch (e) { console.error('[tavo-widgets] reservieren/step-validation.js', e); }
