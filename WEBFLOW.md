# Einbau in Webflow · Seite „Reservieren Widget“ (/reservieren-widget)

`<user>` durch deinen GitHub-User bzw. deine Org ersetzen.

## 1. Page Settings → Custom Code → Inside `<head>`

Den **kompletten** bisherigen Inhalt ersetzen durch:

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/<user>/tavo-widgets@1.0.0/dist/reservieren.min.css">
<script>window.TAVO_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indpd2hic3p3a3Vla3hrZGlxY2dkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODczNDQ4NzYsImV4cCI6MjEwMjkyMDg3Nn0.X4lLnTq0JjlLuS81-YMB-V2yBmw0fO2n0dcTgZ1k7Js";</script>
<script defer src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script defer src="https://cdn.jsdelivr.net/npm/@cornerkit/core@1.3.0/dist/cornerkit.js"></script>
<script defer src="https://cdn.jsdelivr.net/gh/<user>/tavo-widgets@1.0.0/dist/reservieren.min.js"></script>
```

Das ersetzt: Supabase-Script, Stepper, Shop-Info, Step-Gate, Toggle-Switch (CSS + JS).
Before `</body>` ist bereits leer und bleibt leer.

## 2. Embeds löschen (13 Stück)

| # | Klasse im Navigator | Inhalt | → jetzt in |
|---|---|---|---|
| 0 | `ios-corners-js` | iOS Corners + CornerKit | `shared/ios-corners.js` |
| 1 | `sheet-js` | Bottom Sheet | `shared/sheet.js/.css` |
| 2 | `sheet-nav-js` | SheetNav | `shared/sheet-nav.js/.css` |
| 3 | `Browser Font Smoothing` | Font Smoothing | `shared/base.css` |
| 4 | `scroller-js` | Snap-Scroll | `reservieren/scroller.js/.css` |
| 5 | `scrollbar-hide-css` | Scrollbar ausblenden | `shared/base.css` |
| 6 | `mozkit-hide-css` | Form-Reset | `shared/form-reset.css` |
| 7 | `textarea-resize-css` | Textarea | `shared/base.css` |
| 8 | – | `.tavo-checkbox:checked` | `reservieren/checkbox.css` |
| 9 | – | Buchungslogik + Floating Labels | `reservieren/booking.js`, `floating-labels.js` |
| 10 | – | Lade-Punkte + Kontaktvalidierung | `reservieren/loading-dots.css`, `contact-validation.js` |
| 11 | `sheet-nav-header-scroller` | Scroll-Header | `shared/header-scroller.js` |
| 12 | – | Feld-Fehlermeldungen | `reservieren/step-validation.js` |

**Stehen lassen:** Embed #13 (Success-Icon mit Konfetti-SVG). Das ist Markup, kein Code.

## 3. Testen vor dem Publish

Empfehlung: erst auf einer Kopie der Seite (`reservieren-widget-test`), dann auf die echte übertragen.

- Konsole: keine Fehler mit `[tavo-widgets]` oder `[tavo-booking]`
- Sheet öffnet/zieht, SheetNav Schritt 1 → 2 → 3, Weiter-Button sperrt bei fehlenden Angaben
- Datum/Uhrzeit/Bereich laden aus Supabase, Öffnungszeiten + Restaurantname erscheinen
- Kontaktfelder: Floating Labels, Fehlertexte, Lade-Punkte beim Absenden
- Testbuchung komplett durch → Success-Icon
- iOS-Ecken sichtbar, Header-Schatten beim Scrollen im Sheet

## Rückweg

Head-Code und Embeds sind in der Webflow-Versionshistorie (Site Settings → Backups).
Vor dem Umbau ein Backup anlegen, dann ist der Rückweg ein Klick.
