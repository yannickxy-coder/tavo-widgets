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
