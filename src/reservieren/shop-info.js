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
