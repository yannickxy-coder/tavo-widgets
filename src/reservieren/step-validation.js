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
