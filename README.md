# tavo-widgets

Code des tavo Reservieren-Widgets (`/reservieren-widget`), ausgeliefert über jsDelivr statt als Webflow-Embeds.

```
src/
  shared/        Sheet, SheetNav, iOS Corners, Scroll-Header, Basis-CSS
  reservieren/   Buchungslogik, Stepper, Validierung, Toggle, Snap-Scroll
dist/
  reservieren.min.js    <- wird in Webflow eingebunden
  reservieren.min.css   <- wird in Webflow eingebunden
build.mjs        Reihenfolge der Module (= Reihenfolge wie vorher in Webflow)
WEBFLOW.md       Einbau-Anleitung für Webflow
```

## Regel

In Webflow bleiben nur **Markup, Attribute und Konfiguration** (`window.TAVO_ANON_KEY`, Success-Icon-Embed).
Jede Zeile JS/CSS lebt hier.

## Ersteinrichtung

```bash
git init && git add -A && git commit -m "v1.0.0: Reservieren-Widget aus Webflow migriert"
gh repo create tavo-widgets --public --source=. --push
git tag v1.0.0 && git push --tags
```

Das Repo muss **public** sein, sonst liefert jsDelivr nichts aus.

Check: `https://cdn.jsdelivr.net/gh/<user>/tavo-widgets@1.0.0/dist/reservieren.min.js` muss Code zeigen.

## Änderungen ausrollen

```bash
npm install          # einmalig (esbuild)
# src/ bearbeiten
npm run build
git add -A && git commit -m "…"
npm version patch    # 1.0.0 -> 1.0.1 + Tag v1.0.1
git push --follow-tags
```

Dann in Webflow im Head beide URLs auf die neue Version ändern und publishen.

- **Nie `@main` in Produktion.** jsDelivr cached Branches bis zu 7 Tage. Tags sind unveränderlich und sofort korrekt.
- Testen vor dem Tag: `…/tavo-widgets@<commit-sha>/dist/reservieren.min.js`

## Stand v1.0.0

1:1-Migration der Embeds vom 19.09.2026, Verhalten unverändert. Jedes Modul läuft in einem eigenen `try`-Block,
ein Fehler in einem Modul stoppt die anderen nicht.

## Offene Baustellen

- Supabase-URL ist in `booking.js` und `shop-info.js` hart verdrahtet → zentral über `window.TAVO_CONFIG`.
- `supabase-js@2` auf exakte Version pinnen.
- `steps.js` (alter Stepper `[data-tavo-steps]`) und `step-gate.js` (SheetNav-Stepper) überschneiden sich.

## Changelog

- **1.0.0** · 1:1-Migration der Embeds vom 19.09.2026 (Stand nach Publish 18:21 UTC).
  Einziger Unterschied zu Webflow: Countdown-Text in `booking.js` repariert
  („in 5 Sekunde.n." → „in 5 Sekunden.").
  `shared/sheet.js/.css` ist die neue Sheet-Version (v3): Scrim wird nicht mehr per JS erzeugt,
  sondern in Webflow gebaut (`[data-sheet-scrim="<name>"]`, Look über `.is-open`).
  Backdrop-Effekt (`data-sheet-backdrop*`) entfällt.
