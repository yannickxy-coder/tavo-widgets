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
