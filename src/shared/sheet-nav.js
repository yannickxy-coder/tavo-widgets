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
