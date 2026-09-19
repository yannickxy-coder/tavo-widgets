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
