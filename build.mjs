// Baut dist/<bundle>.js|.css (+ .min) aus src/.
// Reihenfolge = Reihenfolge, in der der Code vorher in Webflow lief
// (Page-Head -> Embeds in DOM-Reihenfolge -> Page-Footer). Nicht umsortieren.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { transform } from 'esbuild';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

const BUNDLES = {
  reservieren: {
    js: [
      'reservieren/steps.js',
      'reservieren/shop-info.js',
      'reservieren/step-gate.js',
      'reservieren/toggle-switch.js',
      'shared/ios-corners.js',
      'shared/sheet.js',
      'shared/sheet-nav.js',
      'reservieren/scroller.js',
      'reservieren/booking.js',
      'reservieren/floating-labels.js',
      'reservieren/contact-validation.js',
      'shared/header-scroller.js',
      'reservieren/step-validation.js',
    ],
    css: [
      'reservieren/toggle-switch.css',
      'shared/sheet.css',
      'shared/sheet-nav.css',
      'shared/base.css',
      'reservieren/scroller.css',
      'shared/form-reset.css',
      'reservieren/checkbox.css',
      'reservieren/loading-dots.css',
    ],
  },
};

const banner = (name) => `/*! tavo-widgets/${name} v${pkg.version} · yaaay.studio */`;

// Jedes Modul in eigenem try-Block: Ein Laufzeitfehler in einem Modul
// stoppt nicht mehr den Rest (vorher = getrennte <script>-Tags).
const wrapJs = (file, src) =>
  `/* ---- ${file} ---- */\ntry {\n${src}\n} catch (e) { console.error('[tavo-widgets] ${file}', e); }\n`;

mkdirSync('dist', { recursive: true });

for (const [name, { js, css }] of Object.entries(BUNDLES)) {
  const jsSrc = banner(name) + '\n' + js.map((f) => wrapJs(f, readFileSync('src/' + f, 'utf8'))).join('\n');
  const cssSrc = banner(name) + '\n' + css.map((f) => `/* ---- ${f} ---- */\n` + readFileSync('src/' + f, 'utf8')).join('\n');

  writeFileSync(`dist/${name}.js`, jsSrc);
  writeFileSync(`dist/${name}.css`, cssSrc);

  const jsMin = await transform(jsSrc, { loader: 'js', minify: true, target: 'es2019', legalComments: 'inline' });
  const cssMin = await transform(cssSrc, { loader: 'css', minify: true, legalComments: 'inline' });
  writeFileSync(`dist/${name}.min.js`, jsMin.code);
  writeFileSync(`dist/${name}.min.css`, cssMin.code);

  console.log(`${name}: js ${jsSrc.length} -> ${jsMin.code.length} B, css ${cssSrc.length} -> ${cssMin.code.length} B`);
}
