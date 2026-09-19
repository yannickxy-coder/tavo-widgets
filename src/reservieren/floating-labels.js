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
