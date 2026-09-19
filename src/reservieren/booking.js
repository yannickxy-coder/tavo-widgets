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
